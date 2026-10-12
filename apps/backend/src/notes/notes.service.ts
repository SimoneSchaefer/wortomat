import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateNoteRequest,
  EditorDoc,
  NoteContent,
  NoteKind,
  NoteSummary,
  SaveDocumentRequest,
  UpdateNoteRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ProjectService } from '../project/project.service.js';

const NOTE_KINDS: readonly NoteKind[] = ['character', 'place', 'research'];

interface NoteRow {
  id: string;
  kind: NoteKind;
  title: string;
  summary: string;
  updated_at: string;
}

/** Charaktere, Orte und Forschungsnotizen – alles, was neben dem Manuskript zum Buch gehört. */
@Injectable()
export class NotesService {
  constructor(private readonly projects: ProjectService) {}

  private get db() {
    return this.projects.db;
  }

  list(kind?: NoteKind): NoteSummary[] {
    const rows = (kind === undefined
      ? this.db.prepare('SELECT id, kind, title, summary, updated_at FROM notes').all()
      : this.db
          .prepare('SELECT id, kind, title, summary, updated_at FROM notes WHERE kind = ?')
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
      // Gleich in den Suchindex, damit die Notiz auch ohne Text über den Titel gefunden wird.
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
      typeof request?.summary === 'string' ? request.summary.trim().slice(0, 500) : note.summary;
    transaction(this.db, () => {
      this.db
        .prepare('UPDATE notes SET title = ?, summary = ?, updated_at = ? WHERE id = ?')
        .run(title, summary, nowIso(), id);
      this.db
        .prepare('UPDATE note_fts SET title = ?, summary = ? WHERE note_id = ?')
        .run(title, summary, id);
      this.projects.touch();
    });
    return this.get(id);
  }

  remove(id: string): void {
    this.get(id);
    transaction(this.db, () => {
      this.db.prepare('DELETE FROM note_fts WHERE note_id = ?').run(id);
      this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
      this.projects.touch();
    });
  }

  getContent(id: string): NoteContent {
    const row = this.db
      .prepare('SELECT doc, word_count, updated_at FROM notes WHERE id = ?')
      .get(id) as { doc: string | null; word_count: number; updated_at: string } | undefined;
    if (!row) {
      throw new NotFoundException('Notiz nicht gefunden.');
    }
    return {
      id,
      doc: row.doc ? (JSON.parse(row.doc) as EditorDoc) : null,
      wordCount: row.word_count,
      updatedAt: row.updated_at,
    };
  }

  saveContent(id: string, request: SaveDocumentRequest): NoteContent {
    this.get(id);
    if (request?.doc?.type !== 'doc') {
      throw new BadRequestException('Ungültiges Dokument.');
    }
    const wordCount =
      Number.isInteger(request.wordCount) && request.wordCount >= 0 ? request.wordCount : 0;
    const text = typeof request.text === 'string' ? request.text : '';
    const now = nowIso();
    transaction(this.db, () => {
      this.db
        .prepare('UPDATE notes SET doc = ?, word_count = ?, updated_at = ? WHERE id = ?')
        .run(JSON.stringify(request.doc), wordCount, now, id);
      this.db.prepare('UPDATE note_fts SET body = ? WHERE note_id = ?').run(text, id);
      this.projects.touch();
    });
    return { id, doc: request.doc, wordCount, updatedAt: now };
  }

  private get(id: string): NoteSummary {
    const row = this.db
      .prepare('SELECT id, kind, title, summary, updated_at FROM notes WHERE id = ?')
      .get(id) as NoteRow | undefined;
    if (!row) {
      throw new NotFoundException('Notiz nicht gefunden.');
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
    updatedAt: row.updated_at,
  };
}

function requireKind(kind: unknown): NoteKind {
  if (!NOTE_KINDS.includes(kind as NoteKind)) {
    throw new BadRequestException('Unbekannte Notizart.');
  }
  return kind as NoteKind;
}

function requireTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new BadRequestException('Der Titel darf nicht leer sein.');
  }
  return title.trim();
}
