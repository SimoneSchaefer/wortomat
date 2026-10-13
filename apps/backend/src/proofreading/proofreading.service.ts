import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  EditorDoc,
  ManuscriptNode,
  ProofChapter,
  ProofImportResult,
  ProofNote,
  ProofNotesFile,
  ProofPackage,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';
import { addMark, findAnchor, textBlocks } from './proof-text.js';

/** Höchstlängen, damit eine kaputte oder fremde Datei nichts Unsinniges ins Buch schreibt. */
const MAX_NOTE_LENGTH = 5000;
const MAX_QUOTE_LENGTH = 2000;
const MAX_CONTEXT_LENGTH = 200;

/**
 * Korrekturlesen unterwegs: das Manuskript als reiner Text zum Mitnehmen, und die Notizen von
 * dort zurück ins Buch – als Fixme-Markierungen mit Notiz bzw. Ersetzungsvorschlag.
 */
@Injectable()
export class ProofreadingService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  /** Alle Kapitel mit ihren Szenen in Buchreihenfolge, Absatz für Absatz. */
  package(): ProofPackage {
    const nodes = this.manuscript.list(); // meldet 409, wenn kein Buch geöffnet ist
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
   * Trägt die Notizen ins Buch ein. Je Szene wird das Dokument einmal gelesen, alle Notizen
   * werden markiert und es wird einmal gespeichert – alles oder nichts.
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

    const result: ProofImportResult = { applied: 0, unmatched: [] };
    const changed = new Map<string, EditorDoc>();
    for (const note of notes) {
      const doc = docs.get(note.sceneId); // dasselbe Objekt, auch nach früheren Notizen
      const anchor = doc ? findAnchor(textBlocks(doc), note) : null;
      if (!doc || !anchor) {
        result.unmatched.push({ note, sceneTitle: titles.get(note.sceneId) ?? null });
        continue;
      }
      addMark(anchor, {
        type: 'annotation',
        attrs: { kind: 'fixme', note: note.note || null, suggestion: note.suggestion },
      });
      changed.set(note.sceneId, doc);
      result.applied++;
    }

    transaction(this.db, () => {
      for (const [sceneId, doc] of changed) this.manuscript.replaceMarkedDoc(sceneId, doc);
      if (changed.size) this.projects.touch();
    });
    return result;
  }

  /** Die Dokumente aller Szenen mit Text. */
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
