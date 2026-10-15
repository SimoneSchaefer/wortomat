import { randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type {
  EditorDoc,
  ManuscriptNode,
  ProofChapter,
  ProofImportResult,
  ProofInbox,
  ProofNote,
  ProofNotesFile,
  ProofPackage,
} from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';
import { nowIso, transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';
import { addMark, findAnchor, textBlocks } from './proof-text.js';
import { readerHtml } from './reader/reader-html.js';

/** Upper limits, so a broken or foreign file cannot write nonsense into the book. */
const MAX_NOTE_LENGTH = 5000;
const MAX_QUOTE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 200;

/** Also with "(1)" or similar when the name was taken. */
const NOTES_FILE_NAME = /notizen.*\.txt$/i;
/** Larger files are no notes files; do not even read them. */
const MAX_NOTES_FILE_BYTES = 5 * 1024 * 1024;

interface InboxFile {
  name: string;
  path: string;
  modifiedAt: Date;
  notes: ProofNote[];
  /** Such a file is never deleted. */
  foreign: boolean;
}

/**
 * Proofreading on the go: the manuscript as plain text to take along, and the notes from there back
 * into the book – as fixme marks with a note or a replacement suggestion.
 */
@Injectable()
export class ProofreadingService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
    @Inject(SERVER_OPTIONS) private readonly options: ServerOptions,
  ) {}

  private get db() {
    return this.projects.db;
  }

  package(): ProofPackage {
    const nodes = this.manuscript.list(); // responds with 409 when no book is open
    const project = this.projects.info()!;
    const docs = this.docs();
    const children = (parentId: string | null) =>
      nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

    const chapters: ProofChapter[] = [];
    const addChapter = (chapter: ManuscriptNode, part: string | null) => {
      chapters.push({
        id: chapter.id,
        title: chapter.title,
        number: chapters.length + 1,
        part,
        scenes: children(chapter.id)
          .filter((scene) => scene.kind === 'scene')
          .map((scene) => ({
            id: scene.id,
            title: scene.title,
            paragraphs: textBlocks(docs.get(scene.id)).map((block) => block.text),
          })),
      });
    };
    for (const node of children(null)) {
      if (node.kind === 'part') {
        children(node.id)
          .filter((child) => child.kind === 'chapter')
          .forEach((chapter) => addChapter(chapter, node.title));
      } else if (node.kind === 'chapter') {
        addChapter(node, null);
      }
    }
    return {
      format: 'wortomat-proof',
      version: 1,
      id: randomUUID(),
      title: project.title,
      author: project.author,
      exportedAt: nowIso(),
      chapters,
    };
  }

  /**
   * Each scene's document is read once, all notes are marked and it is saved once – all or nothing.
   */
  import(file: unknown): ProofImportResult {
    const notes = requireNotes(file);
    const docs = this.docs();
    const titles = new Map(
      this.manuscript
        .list()
        .filter((node) => node.kind === 'scene')
        .map((node) => [node.id, node.title]),
    );

    const imported = this.importedIds();
    const result: ProofImportResult = { applied: 0, skipped: 0, unmatched: [] };
    const changed = new Map<string, EditorDoc>();
    const done: string[] = [];
    for (const note of notes) {
      if (imported.has(note.id)) {
        result.skipped++;
        continue;
      }
      const doc = docs.get(note.sceneId); // the same object, also after earlier notes
      const anchor = doc ? findAnchor(textBlocks(doc), note) : null;
      if (!doc || !anchor) {
        result.unmatched.push({ note, sceneTitle: titles.get(note.sceneId) ?? null });
        continue;
      }
      addMark(anchor, {
        type: 'annotation',
        // A "suggestion" that does not change the text is a note
        attrs: {
          kind: 'fixme',
          note: note.note || null,
          suggestion: note.suggestion === note.quote ? null : note.suggestion,
        },
      });
      changed.set(note.sceneId, doc);
      done.push(note.id);
      result.applied++;
    }

    transaction(this.db, () => {
      for (const [sceneId, doc] of changed) this.manuscript.replaceMarkedDoc(sceneId, doc);
      // Notes that cannot be placed stay open: maybe the passage matches after a correction
      const remember = this.db.prepare(
        'INSERT OR IGNORE INTO proof_imported (note_id, imported_at) VALUES (?, ?)',
      );
      const now = nowIso();
      for (const id of done) remember.run(id, now);
      if (changed.size) this.projects.touch();
    });
    return result;
  }

  /**
   * Notes files for this book in the downloads folder (mail attachment, GSConnect …), and how many
   * of their notes are new.
   */
  inbox(): ProofInbox {
    const files = this.inboxFiles();
    const imported = this.importedIds();
    const fresh = new Set<string>();
    const result = files.map((file) => {
      const newIds = file.notes.filter((note) => !imported.has(note.id)).map((note) => note.id);
      newIds.forEach((id) => fresh.add(id));
      return {
        name: file.name,
        modifiedAt: file.modifiedAt.toISOString(),
        notes: file.notes.length,
        newNotes: newIds.length,
        done: !file.foreign && newIds.length === 0,
      };
    });
    return { dir: this.downloadsDir, files: result, newNotes: fresh.size };
  }

  /**
   * If a note appears in several files (the phone always sends all of them), the version from the
   * newest file wins.
   */
  importInbox(): ProofImportResult {
    const byId = new Map<string, ProofNote>();
    for (const file of [...this.inboxFiles()].reverse()) {
      for (const note of file.notes) byId.set(note.id, note);
    }
    return this.import({
      format: 'wortomat-proof-notes',
      version: 1,
      packageId: '',
      title: '',
      exportedAt: nowIso(),
      notes: [...byId.values()],
    });
  }

  /**
   * Files with open or foreign notes (another book) stay.
   * @returns the names of the deleted files
   */
  cleanInbox(): string[] {
    const imported = this.importedIds();
    const deleted: string[] = [];
    for (const file of this.inboxFiles()) {
      if (file.foreign || !file.notes.every((note) => imported.has(note.id))) continue;
      unlinkSync(file.path);
      deleted.push(file.name);
    }
    return deleted;
  }

  private get downloadsDir(): string {
    return this.options.downloadsDir ?? path.join(os.homedir(), 'Downloads');
  }

  /** Newest first; unreadable or foreign files are skipped silently. */
  private inboxFiles(): InboxFile[] {
    const dir = this.downloadsDir;
    if (!existsSync(dir)) return [];
    const scenes = new Set(
      this.manuscript
        .list()
        .filter((node) => node.kind === 'scene')
        .map((node) => node.id),
    );
    const files: InboxFile[] = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !NOTES_FILE_NAME.test(entry.name)) continue;
      const filePath = path.join(dir, entry.name);
      try {
        const stat = statSync(filePath);
        if (stat.size > MAX_NOTES_FILE_BYTES) continue;
        const all = requireNotes(JSON.parse(readFileSync(filePath, 'utf8')));
        const notes = all.filter((note) => scenes.has(note.sceneId));
        if (!notes.length) continue;
        files.push({
          name: entry.name,
          path: filePath,
          modifiedAt: stat.mtime,
          notes,
          foreign: notes.length < all.length,
        });
      } catch {
        // not a (valid) notes file
      }
    }
    return files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }

  private importedIds(): Set<string> {
    return new Set(
      (
        this.db.prepare('SELECT note_id FROM proof_imported').all() as Array<{ note_id: string }>
      ).map((row) => row.note_id),
    );
  }

  readerFile(): { fileName: string; html: string } {
    const proof = this.package();
    const name = proof.title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Wortomat';
    return { fileName: `${name} – Korrekturfassung.html`, html: readerHtml(proof) };
  }

  private docs(): Map<string, EditorDoc> {
    const rows = this.db
      .prepare(
        `SELECT c.node_id, c.doc FROM scene_content c
           JOIN nodes n ON n.id = c.node_id WHERE n.kind = 'scene'`,
      )
      .all() as Array<{ node_id: string; doc: string }>;
    return new Map(rows.map((row) => [row.node_id, JSON.parse(row.doc) as EditorDoc]));
  }
}

function requireNotes(file: unknown): ProofNote[] {
  const invalid = () =>
    new BadRequestException(
      localized(
        'Das ist keine Notizdatei aus der Korrekturfassung.',
        'This is not a notes file from a proofreading copy.',
      ),
    );
  const data = file as Partial<ProofNotesFile> | null;
  if (data?.format !== 'wortomat-proof-notes' || !Array.isArray(data.notes)) throw invalid();
  if (data.version !== 1) {
    throw new BadRequestException(
      localized(
        'Die Notizdatei stammt aus einer neueren Wortomat-Version.',
        'The notes file comes from a newer Wortomat version.',
      ),
    );
  }
  const text = (value: unknown, max: number) =>
    typeof value === 'string' && value.length <= max ? value : null;
  return data.notes.map((raw: Partial<ProofNote>) => {
    const quote = text(raw?.quote, MAX_QUOTE_LENGTH);
    const note = text(raw?.note ?? '', MAX_NOTE_LENGTH);
    const suggestion = raw?.suggestion == null ? null : text(raw.suggestion, MAX_QUOTE_LENGTH);
    if (
      typeof raw?.sceneId !== 'string' ||
      !quote ||
      note === null ||
      (raw.suggestion != null && suggestion === null) ||
      !Number.isInteger(raw.paragraph)
    ) {
      throw invalid();
    }
    return {
      id: typeof raw.id === 'string' ? raw.id : randomUUID(),
      sceneId: raw.sceneId,
      paragraph: raw.paragraph!,
      quote,
      prefix: text(raw.prefix ?? '', MAX_CONTEXT_LENGTH) ?? '',
      suffix: text(raw.suffix ?? '', MAX_CONTEXT_LENGTH) ?? '',
      note,
      suggestion,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
    };
  });
}
