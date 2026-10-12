import type { DatabaseSync } from 'node:sqlite';

/** Führt `fn` in einer Transaktion aus; bei einer Exception wird alles zurückgerollt. */
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
