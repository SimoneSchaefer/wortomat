import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import type { Tag, TagSummary } from '@wortomat/shared';
import { transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';

const MAX_TAG_LENGTH = 40;
const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/**
 * Freie Schlagwörter für Szenen. Tags gehören zum Projekt und werden über ihren Namen
 * wiederverwendet; ungenutzte Tags verschwinden aus den Vorschlägen und werden aufgeräumt.
 */
@Injectable()
export class TagsService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  /** Alle Tags, die mindestens an einer Szene hängen, alphabetisch. */
  list(): TagSummary[] {
    const rows = this.db
      .prepare(
        `SELECT t.id, t.name, COUNT(*) AS scene_count
           FROM tags t JOIN scene_tags st ON st.tag_id = t.id
          GROUP BY t.id`,
      )
      .all() as Array<{ id: string; name: string; scene_count: number }>;
    return rows
      .map((row) => ({ id: row.id, name: row.name, sceneCount: row.scene_count }))
      .sort((a, b) => collator.compare(a.name, b.name));
  }

  forScene(sceneId: string): Tag[] {
    this.manuscript.requireScene(sceneId);
    const rows = this.db
      .prepare(
        `SELECT t.id, t.name FROM tags t JOIN scene_tags st ON st.tag_id = t.id
          WHERE st.scene_id = ?`,
      )
      .all(sceneId) as unknown as Tag[];
    return rows.sort((a, b) => collator.compare(a.name, b.name));
  }

  /** Vergibt einen Tag per Name – vorhandene werden wiederverwendet, neue angelegt. */
  add(sceneId: string, rawName: unknown): Tag[] {
    this.manuscript.requireScene(sceneId);
    const name = normalizeTagName(rawName);
    const key = tagKey(name);
    transaction(this.db, () => {
      const existing = this.db.prepare('SELECT id FROM tags WHERE key = ?').get(key) as
        { id: string } | undefined;
      const tagId = existing?.id ?? randomUUID();
      if (!existing) {
        this.db.prepare('INSERT INTO tags (id, name, key) VALUES (?, ?, ?)').run(tagId, name, key);
      }
      this.db
        .prepare('INSERT OR IGNORE INTO scene_tags (scene_id, tag_id) VALUES (?, ?)')
        .run(sceneId, tagId);
      this.projects.touch();
    });
    return this.forScene(sceneId);
  }

  remove(sceneId: string, tagId: string): Tag[] {
    this.manuscript.requireScene(sceneId);
    transaction(this.db, () => {
      this.db
        .prepare('DELETE FROM scene_tags WHERE scene_id = ? AND tag_id = ?')
        .run(sceneId, tagId);
      this.deleteUnusedTags();
      this.projects.touch();
    });
    return this.forScene(sceneId);
  }

  /**
   * Entfernt Tags ohne Szene – auch solche, die durch das Löschen von Szenen
   * verwaist sind (dort räumt der Fremdschlüssel nur die Zuordnung ab).
   */
  private deleteUnusedTags(): void {
    this.db.exec('DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM scene_tags)');
  }
}

/** Anzeigeform: ohne führendes „#“, Leerraum zusammengefasst, höchstens 40 Zeichen. */
export function normalizeTagName(raw: unknown): string {
  const name =
    typeof raw === 'string' ? raw.trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim() : '';
  if (!name) {
    throw new BadRequestException('Bitte einen Tag-Namen angeben.');
  }
  if (name.length > MAX_TAG_LENGTH) {
    throw new BadRequestException(`Tags dürfen höchstens ${MAX_TAG_LENGTH} Zeichen lang sein.`);
  }
  return name;
}

/** Vergleichsschlüssel – auch Umlaute werden kleingeschrieben (SQLite-NOCASE kann nur A–Z). */
export function tagKey(name: string): string {
  return name.toLocaleLowerCase('de');
}
