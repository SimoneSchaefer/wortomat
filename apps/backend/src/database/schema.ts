import { DatabaseSync } from 'node:sqlite';
import { LocalizedError, localized } from '../i18n.js';
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
  /* 2: Notizen (Charaktere, Orte, Forschung) */ `
    CREATE TABLE notes (
      id          TEXT PRIMARY KEY,
      kind        TEXT NOT NULL CHECK (kind IN ('character', 'place', 'research')),
      title       TEXT NOT NULL,
      summary     TEXT NOT NULL DEFAULT '',
      doc         TEXT,
      word_count  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
    CREATE INDEX notes_by_kind ON notes(kind);

    CREATE VIRTUAL TABLE note_fts USING fts5(
      note_id UNINDEXED,
      title,
      summary,
      body,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `,
  /* 3: Bildergalerie je Notiz (z. B. Profilbilder eines Charakters) */ `
    CREATE TABLE note_images (
      note_id     TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      image_id    TEXT NOT NULL REFERENCES images(id),
      sort_order  INTEGER NOT NULL,
      PRIMARY KEY (note_id, image_id)
    );
    CREATE INDEX note_images_by_image ON note_images(image_id);
  `,
  /* 4: Verknüpfungen Szene ↔ Notiz (wer/was kommt in welcher Szene vor) */ `
    CREATE TABLE scene_links (
      scene_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      note_id   TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      PRIMARY KEY (scene_id, note_id)
    );
    CREATE INDEX scene_links_by_note ON scene_links(note_id);
  `,
  /* 5: Tags für Szenen – projektweit, damit gleiche Tags wiederverwendet werden */ `
    CREATE TABLE tags (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      -- normalisierte Form (klein, ohne #): "Rückblende" und "#rückblende" sind derselbe Tag
      key   TEXT NOT NULL UNIQUE
    );

    CREATE TABLE scene_tags (
      scene_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (scene_id, tag_id)
    );
    CREATE INDEX scene_tags_by_tag ON scene_tags(tag_id);
  `,
  /* 6: Arbeitsstand je Szene; vorhandene Szenen starten als „Idee“ */ `
    ALTER TABLE nodes ADD COLUMN status TEXT NOT NULL DEFAULT 'idea'
      CHECK (status IN ('idea', 'outline', 'draft', 'revised', 'final'));
  `,
  /* 7: Anzahl der Todo/Idee/Fixme-Markierungen je Szene (beim Speichern gezählt) */ `
    ALTER TABLE scene_content ADD COLUMN todo_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scene_content ADD COLUMN idea_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scene_content ADD COLUMN fixme_count INTEGER NOT NULL DEFAULT 0;
  `,
  /* 8: Titelbild des Buchs (z. B. Cover im E-Book) */ `
    ALTER TABLE project ADD COLUMN cover_image_id TEXT REFERENCES images(id) ON DELETE SET NULL;
  `,
  /* 9: Gruppe je Notiz (z. B. „Familie Berger“); leer = ohne Gruppe */ `
    ALTER TABLE notes ADD COLUMN group_name TEXT NOT NULL DEFAULT '';
  `,
  /* 10: Gruppen als eigene Einträge (auch leer, umbenennbar); übernimmt die Namen aus 9 */ `
    CREATE TABLE note_groups (
      id          TEXT PRIMARY KEY,
      kind        TEXT NOT NULL CHECK (kind IN ('character', 'place', 'research')),
      name        TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );
    ALTER TABLE notes ADD COLUMN group_id TEXT REFERENCES note_groups(id) ON DELETE SET NULL;

    -- Gleich geschriebene Namen („familie“, „Familie“) werden eine Gruppe.
    INSERT INTO note_groups (id, kind, name, created_at)
      SELECT lower(hex(randomblob(16))), kind, MIN(group_name), MIN(created_at)
        FROM notes WHERE group_name <> ''
       GROUP BY kind, lower(group_name);
    UPDATE notes SET group_id = (
      SELECT g.id FROM note_groups g
       WHERE g.kind = notes.kind AND lower(g.name) = lower(notes.group_name)
    ) WHERE group_name <> '';
    ALTER TABLE notes DROP COLUMN group_name;
  `,
  /* 11: Reihenfolge der Gruppen (per Ziehen); vorhandene starten alphabetisch */ `
    ALTER TABLE note_groups ADD COLUMN sort_order REAL NOT NULL DEFAULT 0;
    UPDATE note_groups SET sort_order = 1 + (
      SELECT COUNT(*) FROM note_groups g
       WHERE g.kind = note_groups.kind
         AND (lower(g.name) < lower(note_groups.name)
              OR (lower(g.name) = lower(note_groups.name) AND g.id < note_groups.id))
    );
  `,
  /* 12: Einstellungen des Export-Dialogs als JSON (Format, Vorlage, Satzspiegel); leer = Vorgaben */ `
    ALTER TABLE project ADD COLUMN export_settings TEXT;
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
    throw new LocalizedError(
      localized(
        `Die Projektdatei wurde mit einer neueren Wortomat-Version erstellt (Schema ${current}, unterstützt: ${SCHEMA_VERSION}).`,
        `The project file was created with a newer Wortomat version (schema ${current}, supported: ${SCHEMA_VERSION}).`,
      ),
    );
  }
  for (let version = current; version < SCHEMA_VERSION; version++) {
    transaction(db, () => {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
