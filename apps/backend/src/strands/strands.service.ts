import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Strand, StrandColor } from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';

const MAX_NAME_LENGTH = 60;

/** Reihenfolge, in der neue Stränge ihre Farbe bekommen. */
export const STRAND_COLORS: readonly StrandColor[] = [
  'violet',
  'teal',
  'rose',
  'amber',
  'blue',
  'green',
  'coral',
  'slate',
];

interface StrandRow {
  id: string;
  name: string;
  color: StrandColor;
  scene_count: number;
}

/**
 * Handlungsstränge. Anders als Tags leben sie unabhängig von Szenen: ein Strang bleibt,
 * bis er ausdrücklich gelöscht wird, auch wenn gerade keine Szene dazugehört.
 */
@Injectable()
export class StrandsService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  /** Alle Stränge in ihrer Reihenfolge. */
  list(): Strand[] {
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.color, COUNT(ss.scene_id) AS scene_count
           FROM strands s LEFT JOIN scene_strands ss ON ss.strand_id = s.id
          GROUP BY s.id
          ORDER BY s.sort_order`,
      )
      .all() as unknown as StrandRow[];
    return rows.map(toStrand);
  }

  create(rawName: unknown, rawColor: unknown): Strand {
    const name = requireName(rawName);
    const color = rawColor === undefined ? this.leastUsedColor() : requireColor(rawColor);
    const id = randomUUID();
    transaction(this.db, () => {
      const { next } = this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM strands')
        .get() as { next: number };
      this.db
        .prepare(
          'INSERT INTO strands (id, name, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(id, name, color, next, nowIso());
      this.projects.touch();
    });
    return this.get(id);
  }

  update(id: string, changes: { name?: unknown; color?: unknown }): Strand {
    const strand = this.get(id);
    const name = changes?.name === undefined ? strand.name : requireName(changes.name);
    const color = changes?.color === undefined ? strand.color : requireColor(changes.color);
    this.db.prepare('UPDATE strands SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    this.projects.touch();
    return this.get(id);
  }

  /**
   * Verschiebt einen Strang vor einen anderen (oder ans Ende) und nummeriert alle neu.
   * @returns alle Stränge in der neuen Reihenfolge
   */
  move(id: string, beforeId: unknown): Strand[] {
    this.get(id);
    if (beforeId !== null && (typeof beforeId !== 'string' || beforeId === id)) {
      throw new BadRequestException(
        localized('Ungültige Zielposition.', 'Invalid target position.'),
      );
    }
    transaction(this.db, () => {
      const others = (
        this.db
          .prepare('SELECT id FROM strands WHERE id != ? ORDER BY sort_order')
          .all(id) as Array<{
          id: string;
        }>
      ).map((row) => row.id);
      const index = beforeId === null ? others.length : others.indexOf(beforeId);
      if (index < 0) {
        throw new NotFoundException(localized('Strang nicht gefunden.', 'Plot thread not found.'));
      }
      others.splice(index, 0, id);
      const setOrder = this.db.prepare('UPDATE strands SET sort_order = ? WHERE id = ?');
      others.forEach((strandId, position) => setOrder.run(position + 1, strandId));
      this.projects.touch();
    });
    return this.list();
  }

  /** Löscht den Strang; die Szenen bleiben, verlieren nur die Zuordnung. */
  remove(id: string): void {
    this.get(id);
    this.db.prepare('DELETE FROM strands WHERE id = ?').run(id);
    this.projects.touch();
  }

  forScene(sceneId: string): Strand[] {
    this.manuscript.requireScene(sceneId);
    const rows = this.db
      .prepare(
        `SELECT s.id, s.name, s.color,
                (SELECT COUNT(*) FROM scene_strands c WHERE c.strand_id = s.id) AS scene_count
           FROM strands s JOIN scene_strands ss ON ss.strand_id = s.id
          WHERE ss.scene_id = ?
          ORDER BY s.sort_order`,
      )
      .all(sceneId) as unknown as StrandRow[];
    return rows.map(toStrand);
  }

  add(sceneId: string, strandId: unknown): Strand[] {
    this.manuscript.requireScene(sceneId);
    if (typeof strandId !== 'string' || !strandId) {
      throw new BadRequestException(
        localized('Bitte einen Strang angeben.', 'Please specify a plot thread.'),
      );
    }
    this.get(strandId);
    this.db
      .prepare('INSERT OR IGNORE INTO scene_strands (scene_id, strand_id) VALUES (?, ?)')
      .run(sceneId, strandId);
    this.projects.touch();
    return this.forScene(sceneId);
  }

  removeFromScene(sceneId: string, strandId: string): Strand[] {
    this.manuscript.requireScene(sceneId);
    this.db
      .prepare('DELETE FROM scene_strands WHERE scene_id = ? AND strand_id = ?')
      .run(sceneId, strandId);
    this.projects.touch();
    return this.forScene(sceneId);
  }

  private get(id: string): Strand {
    const row = this.db
      .prepare(
        `SELECT s.id, s.name, s.color,
                (SELECT COUNT(*) FROM scene_strands c WHERE c.strand_id = s.id) AS scene_count
           FROM strands s WHERE s.id = ?`,
      )
      .get(id) as StrandRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Strang nicht gefunden.', 'Plot thread not found.'));
    }
    return toStrand(row);
  }

  /** Die Farbe, die bisher am seltensten vergeben ist – bei Gleichstand die vordere. */
  private leastUsedColor(): StrandColor {
    const used = new Map<string, number>();
    for (const { color } of this.db.prepare('SELECT color FROM strands').all() as Array<{
      color: string;
    }>) {
      used.set(color, (used.get(color) ?? 0) + 1);
    }
    return STRAND_COLORS.reduce((best, color) =>
      (used.get(color) ?? 0) < (used.get(best) ?? 0) ? color : best,
    );
  }
}

function toStrand(row: StrandRow): Strand {
  return { id: row.id, name: row.name, color: row.color, sceneCount: row.scene_count };
}

function requireName(raw: unknown): string {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
  if (!name) {
    throw new BadRequestException(
      localized('Bitte einen Namen für den Strang angeben.', 'Please name the plot thread.'),
    );
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new BadRequestException(
      localized(
        `Namen von Strängen dürfen höchstens ${MAX_NAME_LENGTH} Zeichen lang sein.`,
        `Plot thread names can be at most ${MAX_NAME_LENGTH} characters long.`,
      ),
    );
  }
  return name;
}

function requireColor(raw: unknown): StrandColor {
  if (!STRAND_COLORS.includes(raw as StrandColor)) {
    throw new BadRequestException(localized('Unbekannte Farbe.', 'Unknown color.'));
  }
  return raw as StrandColor;
}
