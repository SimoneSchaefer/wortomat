import { Injectable } from '@nestjs/common';
import type { WritingDay } from '@wortomat/shared';
import { ProjectService } from '../project/project.service.js';
import { diffWords } from './word-diff.js';

/** Bis zu dieser Uhrzeit zählt das Schreiben noch zum Vortag. */
const DAY_STARTS_AT_HOUR = 4;

/**
 * Schreib-Log: wie viele Wörter an welchem Tag in welcher Szene geschrieben wurden.
 * Gezählt wird brutto – Überarbeiten (ein Wort raus, eins rein) zählt als geschrieben.
 */
@Injectable()
export class WritingLogService {
  constructor(private readonly projects: ProjectService) {}

  private get db() {
    return this.projects.db;
  }

  /**
   * Vergleicht den alten mit dem neuen Text einer Szene und schreibt die Differenz zum
   * heutigen Tag. Eingefügte Wörter (`pastedWords`) gelten nicht als geschrieben.
   * Läuft in der Transaktion des Speicherns.
   */
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

  /** Der heutige Tag (ab 4 Uhr) – auch ohne Einträge, dann mit Nullen. */
  today(now = new Date()): WritingDay {
    const day = writingDay(now);
    return this.days(day, day)[0] ?? { day, added: 0, removed: 0, pasted: 0 };
  }

  /** Summen je Tag, älteste zuerst; Tage ohne Schreiben fehlen. */
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

/** Kalendertag in Ortszeit; vor 4 Uhr ist noch gestern. */
export function writingDay(date: Date): string {
  const shifted = new Date(date.getTime() - DAY_STARTS_AT_HOUR * 60 * 60 * 1000);
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return `${shifted.getFullYear()}-${month}-${day}`;
}

function isDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
