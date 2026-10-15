import { Injectable } from '@nestjs/common';
import type { WritingDay } from '@wortomat/shared';
import { ProjectService } from '../project/project.service.js';
import { diffWords } from './word-diff.js';

/** Until this hour, writing still counts towards the previous day. */
const DAY_STARTS_AT_HOUR = 4;

/** Counted gross – revising (one word out, one in) counts as written. */
@Injectable()
export class WritingLogService {
  constructor(private readonly projects: ProjectService) {}

  private get db() {
    return this.projects.db;
  }

  /** Pasted words (`pastedWords`) do not count as written. Runs inside the save transaction. */
  record(sceneId: string, before: string, after: string, pastedWords: number, now = new Date()) {
    const { added, removed } = diffWords(before, after);
    const pasted = Math.min(added, Math.max(0, Math.floor(pastedWords) || 0));
    if (!added && !removed) return;
    this.db
      .prepare(
        `INSERT INTO writing_log (day, scene_id, added, removed, pasted) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (day, scene_id) DO UPDATE SET
           added = added + excluded.added,
           removed = removed + excluded.removed,
           pasted = pasted + excluded.pasted`,
      )
      .run(writingDay(now), sceneId, added - pasted, removed, pasted);
  }

  /** Also without entries, then with zeros. */
  today(now = new Date()): WritingDay {
    const day = writingDay(now);
    return this.days(day, day)[0] ?? { day, added: 0, removed: 0, pasted: 0 };
  }

  /** Oldest first; days without writing are missing. */
  days(from?: string, to?: string): WritingDay[] {
    return this.db
      .prepare(
        `SELECT day, SUM(added) AS added, SUM(removed) AS removed, SUM(pasted) AS pasted
           FROM writing_log
          WHERE day >= ? AND day <= ?
          GROUP BY day
          ORDER BY day`,
      )
      .all(
        isDay(from) ? from : '0000-00-00',
        isDay(to) ? to : '9999-99-99',
      ) as unknown as WritingDay[];
  }
}

/** Before 4 am it is still yesterday. */
export function writingDay(date: Date): string {
  const shifted = new Date(date.getTime() - DAY_STARTS_AT_HOUR * 60 * 60 * 1000);
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${shifted.getFullYear()}-${month}-${day}`;
}

function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
