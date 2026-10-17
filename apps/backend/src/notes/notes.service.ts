import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AnnotationCounts,
  CreateNoteGroupRequest,
  CreateNoteRequest,
  MoveNoteGroupRequest,
  EditorDoc,
  GalleryImage,
  ImageCrop,
  NoteContent,
  NoteGroup,
  NoteKind,
  NoteSummary,
  SaveDocumentRequest,
  UpdateNoteGroupRequest,
  UpdateNoteRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ImagesService, type UploadedImage } from '../images/images.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';
import { countAnnotations } from '../manuscript/annotations.js';
import { moveNoteToTrash } from '../trash/snapshot.js';

const NOTE_KINDS: readonly NoteKind[] = ['character', 'place', 'research'];
/** Same as in the frontend (`NotePage`), which limits the input the same way. */
const MAX_SUMMARY_LENGTH = 2000;

/** The profile picture is the first image of the gallery. */
const SUMMARY_COLUMNS = `id, kind, title, summary, group_id, updated_at,
  todo_count, idea_count, fixme_count,
  (SELECT image_id FROM note_images WHERE note_id = notes.id ORDER BY sort_order LIMIT 1)
    AS cover_image_id,
  (SELECT crop FROM note_images WHERE note_id = notes.id ORDER BY sort_order LIMIT 1)
    AS cover_crop`;

interface NoteRow {
  id: string;
  kind: NoteKind;
  title: string;
  summary: string;
  group_id: string | null;
  updated_at: string;
  cover_image_id: string | null;
  cover_crop: string | null;
  todo_count: number;
  idea_count: number;
  fixme_count: number;
}

@Injectable()
export class NotesService {
  constructor(
    private readonly projects: ProjectService,
    private readonly images: ImagesService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  list(kind?: NoteKind): NoteSummary[] {
    const rows = (kind === undefined
      ? this.db.prepare(`SELECT ${SUMMARY_COLUMNS} FROM notes`).all()
      : this.db
          .prepare(`SELECT ${SUMMARY_COLUMNS} FROM notes WHERE kind = ?`)
          .all(requireKind(kind))) as unknown as NoteRow[];
    return rows.map(toSummary);
  }

  create(request: CreateNoteRequest): NoteSummary {
    const kind = requireKind(request?.kind);
    const title = requireTitle(request?.title);
    const id = randomUUID();
    const now = nowIso();
    transaction(this.db, () => {
      this.db
        .prepare(
          'INSERT INTO notes (id, kind, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(id, kind, title, now, now);
      // Into the search index right away, so the note can be found by its title even without text.
      this.db
        .prepare("INSERT INTO note_fts (note_id, title, summary, body) VALUES (?, ?, '', '')")
        .run(id, title);
      this.projects.touch();
    });
    return this.get(id);
  }

  update(id: string, request: UpdateNoteRequest): NoteSummary {
    const note = this.get(id);
    const title = request?.title === undefined ? note.title : requireTitle(request.title);
    const summary =
      typeof request?.summary === 'string'
        ? request.summary.trim().slice(0, MAX_SUMMARY_LENGTH)
        : note.summary;
    const groupId =
      request?.groupId === undefined ? note.groupId : this.requireGroup(request.groupId, note.kind);
    transaction(this.db, () => {
      this.db
        .prepare(
          'UPDATE notes SET title = ?, summary = ?, group_id = ?, updated_at = ? WHERE id = ?',
        )
        .run(title, summary, groupId, nowIso(), id);
      this.db
        .prepare('UPDATE note_fts SET title = ?, summary = ? WHERE note_id = ?')
        .run(title, summary, id);
      this.projects.touch();
    });
    return this.get(id);
  }

  /** The group must exist and belong to the same kind. */
  private requireGroup(groupId: unknown, kind: NoteKind): string | null {
    if (groupId === null) return null;
    const group = this.db
      .prepare('SELECT kind FROM note_groups WHERE id = ?')
      .get(typeof groupId === 'string' ? groupId : '') as { kind: NoteKind } | undefined;
    if (!group || group.kind !== kind) {
      throw new BadRequestException(localized('Unbekannte Gruppe.', 'Unknown group.'));
    }
    return groupId as string;
  }

  listGroups(): NoteGroup[] {
    return this.db
      .prepare('SELECT id, kind, name FROM note_groups ORDER BY kind, sort_order')
      .all() as unknown as NoteGroup[];
  }

  createGroup(request: CreateNoteGroupRequest): NoteGroup {
    const kind = requireKind(request?.kind);
    const name = requireGroupName(request?.name);
    const id = randomUUID();
    transaction(this.db, () => {
      const { next } = this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM note_groups WHERE kind = ?')
        .get(kind) as { next: number };
      this.db
        .prepare(
          'INSERT INTO note_groups (id, kind, name, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(id, kind, name, next, nowIso());
      this.projects.touch();
    });
    return { id, kind, name };
  }

  renameGroup(id: string, request: UpdateNoteGroupRequest): NoteGroup {
    const group = this.getGroup(id);
    const name = requireGroupName(request?.name);
    transaction(this.db, () => {
      this.db.prepare('UPDATE note_groups SET name = ? WHERE id = ?').run(name, id);
      this.projects.touch();
    });
    return { ...group, name };
  }

  /**
   * The groups of that kind are renumbered.
   *
   * @returns all groups in their new order
   */
  moveGroup(id: string, request: MoveNoteGroupRequest): NoteGroup[] {
    const group = this.getGroup(id);
    const beforeId = request?.beforeId ?? null;
    transaction(this.db, () => {
      const others = (
        this.db
          .prepare('SELECT id FROM note_groups WHERE kind = ? AND id != ? ORDER BY sort_order')
          .all(group.kind, id) as Array<{ id: string }>
      ).map((row) => row.id);
      const index = beforeId === null ? others.length : others.indexOf(beforeId);
      if (index < 0) {
        throw new BadRequestException(
          localized(
            'Die Bezugsgruppe gehört nicht zu dieser Art.',
            'The reference group does not belong to this kind.',
          ),
        );
      }
      others.splice(index, 0, id);
      const setOrder = this.db.prepare('UPDATE note_groups SET sort_order = ? WHERE id = ?');
      others.forEach((groupId, position) => setOrder.run(position + 1, groupId));
      this.projects.touch();
    });
    return this.listGroups();
  }

  /** The notes are kept and end up without a group. */
  removeGroup(id: string): void {
    this.getGroup(id);
    transaction(this.db, () => {
      this.db.prepare('DELETE FROM note_groups WHERE id = ?').run(id); // group_id via SET NULL
      this.projects.touch();
    });
  }

  private getGroup(id: string): NoteGroup {
    const group = this.db.prepare('SELECT id, kind, name FROM note_groups WHERE id = ?').get(id) as
      NoteGroup | undefined;
    if (!group) {
      throw new NotFoundException(localized('Gruppe nicht gefunden.', 'Group not found.'));
    }
    return group;
  }

  /** Into the trash, see TrashService. Its gallery images stay until it is deleted for good. */
  remove(id: string): void {
    this.get(id);
    transaction(this.db, () => {
      moveNoteToTrash(this.db, id);
      this.db.prepare('DELETE FROM note_fts WHERE note_id = ?').run(id);
      this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
      this.projects.touch();
    });
  }

  galleryImages(id: string): GalleryImage[] {
    this.get(id);
    return this.galleryRows(id).map((row) => ({
      ...this.images.info(row.image_id),
      crop: parseCrop(row.crop),
    }));
  }

  /** `null` shows the whole image again. */
  setImageCrop(id: string, imageId: string, rawCrop: unknown): GalleryImage[] {
    this.get(id);
    const crop = rawCrop === null ? null : validCrop(rawCrop);
    if (crop === undefined) {
      throw new BadRequestException(localized('Ungültiger Bildausschnitt.', 'Invalid image crop.'));
    }
    transaction(this.db, () => {
      const { changes } = this.db
        .prepare('UPDATE note_images SET crop = ? WHERE note_id = ? AND image_id = ?')
        .run(crop ? JSON.stringify(crop) : null, id, imageId);
      if (!changes) {
        throw new NotFoundException(
          localized('Bild nicht in dieser Galerie.', 'Image not in this gallery.'),
        );
      }
      this.touchNote(id);
    });
    return this.galleryImages(id);
  }

  addImage(id: string, upload: UploadedImage): GalleryImage[] {
    this.get(id);
    transaction(this.db, () => {
      const image = this.images.save(upload);
      const { next } = this.db
        .prepare(
          'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM note_images WHERE note_id = ?',
        )
        .get(id) as { next: number };
      this.db
        .prepare('INSERT INTO note_images (note_id, image_id, sort_order) VALUES (?, ?, ?)')
        .run(id, image.id, next);
      this.touchNote(id);
    });
    return this.galleryImages(id);
  }

  removeImage(id: string, imageId: string): GalleryImage[] {
    this.get(id);
    transaction(this.db, () => {
      const { changes } = this.db
        .prepare('DELETE FROM note_images WHERE note_id = ? AND image_id = ?')
        .run(id, imageId);
      if (!changes) {
        throw new NotFoundException(
          localized('Bild nicht in dieser Galerie.', 'Image not in this gallery.'),
        );
      }
      this.images.deleteIfUnused(imageId);
      this.touchNote(id);
    });
    return this.galleryImages(id);
  }

  /** Must contain exactly the existing images. */
  reorderImages(id: string, imageIds: unknown): GalleryImage[] {
    this.get(id);
    const current = this.imageIds(id);
    const isPermutation =
      Array.isArray(imageIds) &&
      imageIds.length === current.length &&
      new Set(imageIds).size === current.length &&
      imageIds.every((imageId) => current.includes(imageId));
    if (!isPermutation) {
      throw new BadRequestException(
        localized(
          'Die Reihenfolge muss genau die Bilder der Galerie enthalten.',
          'The order must contain exactly the images of the gallery.',
        ),
      );
    }
    transaction(this.db, () => {
      const update = this.db.prepare(
        'UPDATE note_images SET sort_order = ? WHERE note_id = ? AND image_id = ?',
      );
      (imageIds as string[]).forEach((imageId, index) => update.run(index + 1, id, imageId));
      this.touchNote(id);
    });
    return this.galleryImages(id);
  }

  private imageIds(id: string): string[] {
    return this.galleryRows(id).map((row) => row.image_id);
  }

  private galleryRows(id: string): Array<{ image_id: string; crop: string | null }> {
    return this.db
      .prepare('SELECT image_id, crop FROM note_images WHERE note_id = ? ORDER BY sort_order')
      .all(id) as Array<{ image_id: string; crop: string | null }>;
  }

  private touchNote(id: string): void {
    this.db.prepare('UPDATE notes SET updated_at = ? WHERE id = ?').run(nowIso(), id);
    this.projects.touch();
  }

  getContent(id: string): NoteContent {
    const row = this.db
      .prepare(
        `SELECT doc, word_count, updated_at, todo_count, idea_count, fixme_count
           FROM notes WHERE id = ?`,
      )
      .get(id) as
      | (Pick<NoteRow, 'todo_count' | 'idea_count' | 'fixme_count'> & {
          doc: string | null;
          word_count: number;
          updated_at: string;
        })
      | undefined;
    if (!row) {
      throw new NotFoundException(localized('Notiz nicht gefunden.', 'Note not found.'));
    }
    return {
      id,
      doc: row.doc ? (JSON.parse(row.doc) as EditorDoc) : null,
      wordCount: row.word_count,
      annotations: annotationCounts(row),
      updatedAt: row.updated_at,
    };
  }

  saveContent(id: string, request: SaveDocumentRequest): NoteContent {
    this.get(id);
    if (request?.doc?.type !== 'doc') {
      throw new BadRequestException(localized('Ungültiges Dokument.', 'Invalid document.'));
    }
    const wordCount =
      Number.isInteger(request.wordCount) && request.wordCount >= 0 ? request.wordCount : 0;
    const text = typeof request.text === 'string' ? request.text : '';
    const annotations = countAnnotations(request.doc);
    const now = nowIso();
    transaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE notes SET doc = ?, word_count = ?, todo_count = ?, idea_count = ?,
             fixme_count = ?, updated_at = ? WHERE id = ?`,
        )
        .run(
          JSON.stringify(request.doc),
          wordCount,
          annotations.todo,
          annotations.idea,
          annotations.fixme,
          now,
          id,
        );
      this.db.prepare('UPDATE note_fts SET body = ? WHERE note_id = ?').run(text, id);
      this.projects.touch();
    });
    return { id, doc: request.doc, wordCount, annotations, updatedAt: now };
  }

  linkedToScene(sceneId: string): NoteSummary[] {
    const rows = this.db
      .prepare(
        `SELECT ${SUMMARY_COLUMNS} FROM notes
          WHERE id IN (SELECT note_id FROM scene_links WHERE scene_id = ?)`,
      )
      .all(sceneId) as unknown as NoteRow[];
    return rows.map(toSummary);
  }

  get(id: string): NoteSummary {
    const row = this.db.prepare(`SELECT ${SUMMARY_COLUMNS} FROM notes WHERE id = ?`).get(id) as
      NoteRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Notiz nicht gefunden.', 'Note not found.'));
    }
    return toSummary(row);
  }
}

function toSummary(row: NoteRow): NoteSummary {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    summary: row.summary,
    groupId: row.group_id,
    updatedAt: row.updated_at,
    coverImageUrl: row.cover_image_id ? `/api/images/${row.cover_image_id}` : null,
    coverCrop: parseCrop(row.cover_crop),
    annotations: annotationCounts(row),
  };
}

/** Broken JSON counts as "whole image". */
function parseCrop(raw: string | null): ImageCrop | null {
  if (!raw) return null;
  try {
    return validCrop(JSON.parse(raw)) ?? null;
  } catch {
    return null;
  }
}

/** Small rounding errors are allowed. */
function validCrop(value: unknown): ImageCrop | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { x, y, width, height } = value as Record<string, unknown>;
  const numbers = [x, y, width, height];
  if (!numbers.every((n) => typeof n === 'number' && Number.isFinite(n))) return undefined;
  const crop = { x, y, width, height } as ImageCrop;
  const EPSILON = 1e-6;
  const inside =
    crop.x >= -EPSILON &&
    crop.y >= -EPSILON &&
    crop.width > 0.01 &&
    crop.height > 0.01 &&
    crop.x + crop.width <= 1 + EPSILON &&
    crop.y + crop.height <= 1 + EPSILON;
  if (!inside) return undefined;
  const clamp = (n: number) => Math.min(1, Math.max(0, n));
  return { x: clamp(crop.x), y: clamp(crop.y), width: crop.width, height: crop.height };
}

function annotationCounts(
  row: Pick<NoteRow, 'todo_count' | 'idea_count' | 'fixme_count'>,
): AnnotationCounts {
  return { todo: row.todo_count, idea: row.idea_count, fixme: row.fixme_count };
}

function requireKind(kind: unknown): NoteKind {
  if (!NOTE_KINDS.includes(kind as NoteKind)) {
    throw new BadRequestException(localized('Unbekannte Notizart.', 'Unknown note kind.'));
  }
  return kind as NoteKind;
}

function requireTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new BadRequestException(
      localized('Der Titel darf nicht leer sein.', 'The title must not be empty.'),
    );
  }
  return title.trim();
}

function requireGroupName(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new BadRequestException(
      localized('Der Name darf nicht leer sein.', 'The name must not be empty.'),
    );
  }
  return name.trim().slice(0, 100);
}
