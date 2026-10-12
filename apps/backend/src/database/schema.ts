import { DatabaseSync } from 'node:sqlite';
import { transaction } from './sqlite.js';

/**
 * Kennung im SQLite-Header ("WORT"), damit wir eigene Projektdateien
 * von beliebigen anderen SQLite-Dateien unterscheiden können.
 */
export const APPLICATION_ID = 0x574f5254;

/**
 * Jede Migration wird genau einmal ausgeführt; der Stand steht in `PRAGMA user_version`.
 * Bestehende Einträge nie ändern, nur neue anhängen – sonst passen alte Projektdateien nicht mehr.
 */
const MIGRATIONS: readonly string[] = [
  /* 1: Grundschema */ `
    CREATE TABLE project (
      id          INTEGER PRIMARY KEY CHECK (id = 1),
      title       TEXT NOT NULL,
      author      TEXT NOT NULL DEFAULT '',
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE nodes (
      id          TEXT PRIMARY KEY,
      parent_id   TEXT REFERENCES nodes(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL CHECK (kind IN ('part', 'chapter', 'scene')),
      title       TEXT NOT NULL,
      sort_order  REAL NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX nodes_by_parent ON nodes(parent_id, sort_order);

    CREATE TABLE scene_content (
      node_id     TEXT PRIMARY KEY REFERENCES nodes(id) ON DELETE CASCADE,
      doc         TEXT NOT NULL,
      word_count  INTEGER NOT NULL DEFAULT 0,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE images (
      id             TEXT PRIMARY KEY,
      mime_type      TEXT NOT NULL,
      width          INTEGER,
      height         INTEGER,
      byte_size      INTEGER NOT NULL,
      original_name  TEXT,
      data           BLOB NOT NULL,
      created_at     TEXT NOT NULL
    );

    -- Volltextsuche; "remove_diacritics" lässt "hauser" auch "Häuser" finden.
    CREATE VIRTUAL TABLE scene_fts USING fts5(
      node_id UNINDEXED,
      title,
      body,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export function configureConnection(db: DatabaseSync): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
}

export function readApplicationId(db: DatabaseSync): number {
  return (db.prepare('PRAGMA application_id').get() as { application_id: number }).application_id;
}

export function readSchemaVersion(db: DatabaseSync): number {
  return (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
}

/** Bringt die Datenbank auf den aktuellen Schema-Stand. */
export function migrate(db: DatabaseSync): void {
  const current = readSchemaVersion(db);
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `Die Projektdatei wurde mit einer neueren Wortomat-Version erstellt (Schema ${current}, unterstützt: ${SCHEMA_VERSION}).`,
    );
  }
  for (let version = current; version < SCHEMA_VERSION; version++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
