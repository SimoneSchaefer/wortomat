import { Injectable, NotFoundException } from '@nestjs/common';
import type { RestoreResult, TrashEntry } from '@wortomat/shared';
import { transaction } from '../database/sqlite.js';
import { ImagesService } from '../images/images.service.js';
import { localized } from '../i18n.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import { imageIdsIn, restoreFromTrash, type TrashRow } from './snapshot.js';

/** Deleted parts, chapters and scenes; they stay until deleted for good – nothing expires. */
@Injectable()
export class TrashService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
    private readonly images: ImagesService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  list(): TrashEntry[] {
    const rows = this.db
      .prepare(
        `SELECT id, kind, title, path, scene_count, word_count, deleted_at
           FROM trash ORDER BY deleted_at DESC, rowid DESC`,
      )
      .all() as unknown as TrashRow[];
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      path: JSON.parse(row.path) as string[],
      sceneCount: row.scene_count,
      wordCount: row.word_count,
      deletedAt: row.deleted_at,
    }));
  }

  /** @param chapterTitle for the chapter created when a scene has nowhere else to go */
  restore(id: string, chapterTitle: string): RestoreResult {
    const atOldPlace = transaction(this.db, () => {
      const result = restoreFromTrash(this.db, this.snapshot(id), chapterTitle);
      this.db.prepare('DELETE FROM trash WHERE id = ?').run(id);
      this.projects.touch();
      return result;
    });
    return { nodes: this.manuscript.list(), nodeId: id, atOldPlace };
  }

  remove(id: string): void {
    this.deleteForGood([this.snapshot(id)], 'DELETE FROM trash WHERE id = ?', id);
  }

  empty(): void {
    const snapshots = (
      this.db.prepare('SELECT snapshot FROM trash').all() as Array<{ snapshot: string }>
    ).map((row) => row.snapshot);
    this.deleteForGood(snapshots, 'DELETE FROM trash');
  }

  private deleteForGood(snapshots: string[], sql: string, ...params: string[]): void {
    transaction(this.db, () => {
      this.db.prepare(sql).run(...params);
      // Images in the text stayed while it could still come back
      for (const imageId of new Set(snapshots.flatMap(imageIdsIn))) {
        this.images.deleteIfUnused(imageId);
      }
      this.projects.touch();
    });
  }

  private snapshot(id: string): string {
    const row = this.db.prepare('SELECT snapshot FROM trash WHERE id = ?').get(id) as
      { snapshot: string } | undefined;
    if (!row) {
      throw new NotFoundException(
        localized('Nicht mehr im Papierkorb.', 'No longer in the trash.'),
      );
    }
    return row.snapshot;
  }
}
