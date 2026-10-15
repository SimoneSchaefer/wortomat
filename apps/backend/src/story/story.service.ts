import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { SaveStoryRequest, StoryMark, StoryState } from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';

const MAX_LABEL_LENGTH = 40;

/**
 * Story order – independent of the order in the book. The UI rearranges and sends the whole state
 * every time; that keeps the rules (simultaneous scenes, marks) in one place and the numbers small
 * (column 1, 2, 3 …).
 */
@Injectable()
export class StoryService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  marks(): StoryMark[] {
    return this.db
      .prepare('SELECT id, label, position FROM story_marks ORDER BY position, created_at')
      .all() as unknown as StoryMark[];
  }

  save(request: SaveStoryRequest): StoryState {
    const columns = requireColumns(request?.columns);
    const marks = requireMarks(request?.marks, columns.length);
    const scenes = new Set(
      this.manuscript
        .list()
        .filter((node) => node.kind === 'scene')
        .map((node) => node.id),
    );
    const unknown = columns.flat().find((id) => !scenes.has(id));
    if (unknown) {
      throw new BadRequestException(
        localized('Unbekannte Szene in der Reihenfolge.', 'Unknown scene in the order.'),
      );
    }

    transaction(this.db, () => {
      this.db.exec(`UPDATE nodes SET story_order = NULL WHERE kind = 'scene'`);
      const setOrder = this.db.prepare('UPDATE nodes SET story_order = ? WHERE id = ?');
      columns.forEach((ids, index) => ids.forEach((id) => setOrder.run(index + 1, id)));

      const keep = marks.flatMap((mark) => (mark.id ? [mark.id] : []));
      const existing = this.db.prepare('SELECT id FROM story_marks').all() as Array<{ id: string }>;
      const remove = this.db.prepare('DELETE FROM story_marks WHERE id = ?');
      for (const { id } of existing) if (!keep.includes(id)) remove.run(id);
      const upsert = this.db.prepare(
        `INSERT INTO story_marks (id, label, position, created_at) VALUES (?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET label = excluded.label, position = excluded.position`,
      );
      const now = nowIso();
      for (const mark of marks) {
        upsert.run(mark.id ?? randomUUID(), mark.label, mark.beforeColumn + 1, now);
      }
      this.projects.touch();
    });
    return { nodes: this.manuscript.list(), marks: this.marks() };
  }
}

function requireColumns(raw: unknown): string[][] {
  const invalid = () =>
    new BadRequestException(localized('Ungültige Reihenfolge.', 'Invalid order.'));
  if (!Array.isArray(raw)) throw invalid();
  const seen = new Set<string>();
  return raw.map((column) => {
    if (!Array.isArray(column) || !column.length) throw invalid();
    return column.map((id) => {
      if (typeof id !== 'string' || seen.has(id)) throw invalid();
      seen.add(id);
      return id;
    });
  });
}

function requireMarks(
  raw: unknown,
  columnCount: number,
): Array<{ id?: string; label: string; beforeColumn: number }> {
  if (!Array.isArray(raw)) {
    throw new BadRequestException(localized('Ungültige Marken.', 'Invalid marks.'));
  }
  return raw.map((mark) => {
    const label = typeof mark?.label === 'string' ? mark.label.trim().replace(/\s+/g, ' ') : '';
    if (!label || label.length > MAX_LABEL_LENGTH) {
      throw new BadRequestException(
        localized(
          `Abschnitte brauchen einen Namen mit höchstens ${MAX_LABEL_LENGTH} Zeichen.`,
          `Sections need a name of at most ${MAX_LABEL_LENGTH} characters.`,
        ),
      );
    }
    const beforeColumn = mark.beforeColumn;
    if (!Number.isInteger(beforeColumn) || beforeColumn < 0 || beforeColumn >= columnCount) {
      throw new BadRequestException(
        localized('Ein Abschnitt steht an einer ungültigen Stelle.', 'A section is out of range.'),
      );
    }
    const id = typeof mark.id === 'string' && mark.id ? mark.id : undefined;
    return { id, label, beforeColumn };
  });
}
