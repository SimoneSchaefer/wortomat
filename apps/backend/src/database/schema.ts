import { DatabaseSync } from 'node:sqlite';
import { LocalizedError, localized } from '../i18n.js';
import { transaction } from './sqlite.js';
import { countAnnotations } from '../manuscript/annotations.js';

/** A function when existing data has to be converted in TypeScript. */
type Migration = string | ((db: DatabaseSync) => void);

/**
 * Marks the SQLite header ("WORT") so our project files can be told apart from any other SQLite
 * file.
 */
export const APPLICATION_ID = 0x574f5254;

/**
 * Each migration runs exactly once; the version lives in `PRAGMA user_version`. Never change
 * existing entries, only append – otherwise old project files no longer match.
 */
const MIGRATIONS: readonly Migration[] = [
  /* 1: base schema */ `
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

    -- "remove_diacritics" lets "hauser" find "Häuser" too.
    CREATE VIRTUAL TABLE scene_fts USING fts5(
      node_id UNINDEXED,
      title,
      body,
      tokenize = 'unicode61 remove_diacritics 2'
    );
  `,
  /* 2: notes (characters, places, research) */ `
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
  /* 3: image gallery per note */ `
    CREATE TABLE note_images (
      note_id     TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      image_id    TEXT NOT NULL REFERENCES images(id),
      sort_order  INTEGER NOT NULL,
      PRIMARY KEY (note_id, image_id)
    );
    CREATE INDEX note_images_by_image ON note_images(image_id);
  `,
  /* 4: scene ↔ note links */ `
    CREATE TABLE scene_links (
      scene_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      note_id   TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      PRIMARY KEY (scene_id, note_id)
    );
    CREATE INDEX scene_links_by_note ON scene_links(note_id);
  `,
  /* 5: scene tags – project-wide so the same tags get reused */ `
    CREATE TABLE tags (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      -- normalised form (lowercase, no #): "Rückblende" and "#rückblende" are the same tag
      key   TEXT NOT NULL UNIQUE
    );

    CREATE TABLE scene_tags (
      scene_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (scene_id, tag_id)
    );
    CREATE INDEX scene_tags_by_tag ON scene_tags(tag_id);
  `,
  /* 6: status per scene; existing scenes start as idea */ `
    ALTER TABLE nodes ADD COLUMN status TEXT NOT NULL DEFAULT 'idea'
      CHECK (status IN ('idea', 'outline', 'draft', 'revised', 'final'));
  `,
  /* 7: todo/idea/fixme counts per scene, counted on save */ `
    ALTER TABLE scene_content ADD COLUMN todo_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scene_content ADD COLUMN idea_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE scene_content ADD COLUMN fixme_count INTEGER NOT NULL DEFAULT 0;
  `,
  /* 8: book cover */ `
    ALTER TABLE project ADD COLUMN cover_image_id TEXT REFERENCES images(id) ON DELETE SET NULL;
  `,
  /* 9: group per note; empty = no group */ `
    ALTER TABLE notes ADD COLUMN group_name TEXT NOT NULL DEFAULT '';
  `,
  /* 10: groups as rows of their own (can be empty and renamed); takes over the names from 9 */ `
    CREATE TABLE note_groups (
      id          TEXT PRIMARY KEY,
      kind        TEXT NOT NULL CHECK (kind IN ('character', 'place', 'research')),
      name        TEXT NOT NULL,
      created_at  TEXT NOT NULL
    );
    ALTER TABLE notes ADD COLUMN group_id TEXT REFERENCES note_groups(id) ON DELETE SET NULL;

    -- Names spelled alike ("familie", "Familie") become one group.
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
  /* 11: group order (drag and drop); existing groups start alphabetically */ `
    ALTER TABLE note_groups ADD COLUMN sort_order REAL NOT NULL DEFAULT 0;
    UPDATE note_groups SET sort_order = 1 + (
      SELECT COUNT(*) FROM note_groups g
       WHERE g.kind = note_groups.kind
         AND (lower(g.name) < lower(note_groups.name)
              OR (lower(g.name) = lower(note_groups.name) AND g.id < note_groups.id))
    );
  `,
  /* 12: export dialog settings as JSON; empty = defaults */ `
    ALTER TABLE project ADD COLUMN export_settings TEXT;
  `,
  /* 13: writing log – words written and deleted per day and scene */ `
    CREATE TABLE writing_log (
      -- calendar day (YYYY-MM-DD, local time); it starts at 4 am, night shifts count towards the previous day
      day       TEXT NOT NULL,
      -- no foreign key: the history stays even when the scene is deleted
      scene_id  TEXT NOT NULL,
      -- typed by the author (gross)
      added     INTEGER NOT NULL DEFAULT 0,
      removed   INTEGER NOT NULL DEFAULT 0,
      -- pasted or moved by dragging – does not count as written
      pasted    INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (day, scene_id)
    );
  `,
  /* 14: maps with a drawing (strokes as JSON) and placed places */ `
    CREATE TABLE maps (
      id                   TEXT PRIMARY KEY,
      name                 TEXT NOT NULL,
      width                REAL NOT NULL,
      height               REAL NOT NULL,
      background_image_id  TEXT REFERENCES images(id),
      background_opacity   REAL NOT NULL DEFAULT 1,
      strokes              TEXT NOT NULL DEFAULT '[]',
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL
    );

    CREATE TABLE map_pins (
      map_id   TEXT NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
      note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      x        REAL NOT NULL,
      y        REAL NOT NULL,
      PRIMARY KEY (map_id, note_id)
    );
    CREATE INDEX map_pins_by_note ON map_pins(note_id);
  `,
  /* 15: todo/idea/fixme counts per note too; existing notes are counted right away */ (db) => {
    db.exec(`
      ALTER TABLE notes ADD COLUMN todo_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE notes ADD COLUMN idea_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE notes ADD COLUMN fixme_count INTEGER NOT NULL DEFAULT 0;
    `);
    const rows = db.prepare('SELECT id, doc FROM notes WHERE doc IS NOT NULL').all() as Array<{
      id: string;
      doc: string;
    }>;
    const update = db.prepare(
      'UPDATE notes SET todo_count = ?, idea_count = ?, fixme_count = ? WHERE id = ?',
    );
    for (const row of rows) {
      const counts = countAnnotations(JSON.parse(row.doc));
      update.run(counts.todo, counts.idea, counts.fixme, row.id);
    }
  },
  /* 16: plot threads (a scene can belong to several) and turning points */ `
    CREATE TABLE strands (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      -- name of a fixed colour (see StrandColor) so it works in light and dark
      color       TEXT NOT NULL,
      sort_order  REAL NOT NULL,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE scene_strands (
      scene_id   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
      strand_id  TEXT NOT NULL REFERENCES strands(id) ON DELETE CASCADE,
      PRIMARY KEY (scene_id, strand_id)
    );
    CREATE INDEX scene_strands_by_strand ON scene_strands(strand_id);

    ALTER TABLE nodes ADD COLUMN turning_point INTEGER NOT NULL DEFAULT 0;
  `,
  /* 17: story order (independent of the book) and section markers in it */ `
    -- position in the story; equal values = simultaneous. NULL = never set:
    -- the scene then follows its predecessor in the book.
    ALTER TABLE nodes ADD COLUMN story_order REAL;

    -- start of a section ("Day 1", "Winter") before the first scene with story_order >= position
    CREATE TABLE story_marks (
      id          TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      position    REAL NOT NULL,
      created_at  TEXT NOT NULL
    );
  `,
  /* 18: notes already imported from the proofreading copy – the phone always sends all of them */ `
    CREATE TABLE proof_imported (
      note_id      TEXT PRIMARY KEY,
      imported_at  TEXT NOT NULL
    );
  `,
  /* 19: crop of a gallery image (JSON {x, y, width, height}, relative); NULL = whole image */ `
    ALTER TABLE note_images ADD COLUMN crop TEXT;
  `,
  /* 20: character arc – the overall arc as text plus stations, each optionally shown in a scene */ `
    ALTER TABLE notes ADD COLUMN arc TEXT NOT NULL DEFAULT '';

    CREATE TABLE arc_steps (
      id          TEXT PRIMARY KEY,
      note_id     TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      label       TEXT NOT NULL,
      details     TEXT NOT NULL DEFAULT '',
      -- the station survives its scene being deleted; it only loses the reference
      scene_id    TEXT REFERENCES nodes(id) ON DELETE SET NULL,
      sort_order  REAL NOT NULL,
      created_at  TEXT NOT NULL
    );
    CREATE INDEX arc_steps_by_note ON arc_steps(note_id, sort_order);
    CREATE INDEX arc_steps_by_scene ON arc_steps(scene_id);
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
      const migration = MIGRATIONS[version];
      if (typeof migration === 'string') db.exec(migration);
      else migration(db);
      db.exec(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
