import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLInputValue, SQLOutputValue } from 'node:sqlite';
import type { NodeKind, NoteKind } from '@wortomat/shared';
import { nowIso } from '../database/sqlite.js';

type Row = Record<string, SQLOutputValue>;
/** Blobs do not survive JSON, so they are stored as base64. */
type StoredRow = Record<string, string | number | null | { blob: string }>;
type Values = Record<string, SQLInputValue>;

/** The tables whose rows can be in the trash. */
type Source = 'nodes' | 'notes';

interface StoredReference {
  table: string;
  column: string;
  key: StoredRow;
  value: string;
}

/**
 * Everything that deleting a subtree or a note removes or changes. Trashed rows leave the regular
 * tables completely, so no query elsewhere (tree, search, export, statistics …) has to filter
 * them out. Tables are found through their foreign keys instead of being listed here, so a table
 * added later that refers to nodes or notes is covered without touching this file.
 */
interface Snapshot {
  version: 2;
  table: Source;
  /** The deleted rows; for nodes parents before their children, so they can be inserted in order. */
  rows: StoredRow[];
  /**
   * Rows removed along with them by ON DELETE CASCADE, per table – and rows handed over by
   * another restore because they also refer to something in here.
   */
  dependents: Record<string, StoredRow[]>;
  /** Rows that only lost their reference to one of them (ON DELETE SET NULL). */
  references: StoredReference[];
  /** Unused tags get cleaned up, so the tags of the scenes may be gone when restoring. */
  tags: StoredRow[];
  /** The search index has no foreign key. */
  fts: StoredRow[];
}

/** Written before notes could be trashed. */
interface SnapshotV1 extends Omit<Snapshot, 'version' | 'table' | 'rows'> {
  version: 1;
  nodes: StoredRow[];
}

const FTS_TABLE: Record<Source, string> = { nodes: 'scene_fts', notes: 'note_fts' };

interface ForeignKey {
  table: string;
  column: string;
  target: string;
  targetColumn: string;
  onDelete: string;
}

export interface TrashRow {
  id: string;
  kind: NodeKind | NoteKind;
  title: string;
  path: string;
  scene_count: number;
  word_count: number;
  deleted_at: string;
}

/** Copies the subtree into the trash; the caller deletes it from `nodes` afterwards. */
export function moveToTrash(db: DatabaseSync, nodeId: string): void {
  const ids = subtreeIds(db, nodeId);
  const idList = JSON.stringify(ids);
  const inSubtree = 'IN (SELECT value FROM json_each(?))';
  const nodes = db
    .prepare(`SELECT n.* FROM nodes n JOIN json_each(?) s ON s.value = n.id ORDER BY s.key`)
    .all(idList) as Row[];
  const root = nodes[0]!;

  const snapshot = collect(db, 'nodes', nodes, ids);
  snapshot.tags = (
    db
      .prepare(
        `SELECT DISTINCT t.* FROM tags t JOIN scene_tags st ON st.tag_id = t.id
          WHERE st.scene_id ${inSubtree}`,
      )
      .all(idList) as Row[]
  ).map(store);

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS scenes, COALESCE(SUM(c.word_count), 0) AS words
         FROM nodes n LEFT JOIN scene_content c ON c.node_id = n.id
        WHERE n.kind = 'scene' AND n.id ${inSubtree}`,
    )
    .get(idList) as { scenes: number; words: number };
  insertEntry(db, snapshot, {
    id: nodeId,
    kind: root['kind'] as NodeKind,
    title: root['title'] as string,
    path: JSON.stringify(ancestorTitles(db, root['parent_id'] as string | null)),
    scene_count: totals.scenes,
    word_count: totals.words,
    deleted_at: nowIso(),
  });
}

/** Copies the note into the trash; the caller deletes it from `notes` afterwards. */
export function moveNoteToTrash(db: DatabaseSync, noteId: string): void {
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId) as Row;
  const group = db
    .prepare('SELECT name FROM note_groups WHERE id = ?')
    .get(note['group_id'] ?? null) as { name: string } | undefined;
  const { scenes } = db
    .prepare('SELECT COUNT(*) AS scenes FROM scene_links WHERE note_id = ?')
    .get(noteId) as { scenes: number };
  insertEntry(db, collect(db, 'notes', [note], [noteId]), {
    id: noteId,
    kind: note['kind'] as NoteKind,
    title: note['title'] as string,
    path: JSON.stringify(group ? [group.name] : []),
    scene_count: scenes,
    word_count: note['word_count'] as number,
    deleted_at: nowIso(),
  });
}

function collect(db: DatabaseSync, table: Source, rows: Row[], ids: string[]): Snapshot {
  const idList = JSON.stringify(ids);
  const inIds = 'IN (SELECT value FROM json_each(?))';
  const ftsKey = table === 'nodes' ? 'node_id' : 'note_id';
  const snapshot: Snapshot = {
    version: 2,
    table,
    rows: rows.map(store),
    dependents: {},
    references: [],
    tags: [],
    fts: (
      db.prepare(`SELECT * FROM ${FTS_TABLE[table]} WHERE ${ftsKey} ${inIds}`).all(idList) as Row[]
    ).map(store),
  };
  for (const key of foreignKeys(db)) {
    if (key.target !== table || key.table === table) continue;
    const found = db
      .prepare(`SELECT * FROM "${key.table}" WHERE "${key.column}" ${inIds}`)
      .all(idList) as Row[];
    if (key.onDelete === 'CASCADE') {
      (snapshot.dependents[key.table] ??= []).push(...found.map(store));
    } else if (key.onDelete === 'SET NULL') {
      for (const row of found) {
        snapshot.references.push({
          table: key.table,
          column: key.column,
          key: store(primaryKey(db, key.table, row)),
          value: row[key.column] as string,
        });
      }
    }
  }
  return snapshot;
}

function insertEntry(db: DatabaseSync, snapshot: Snapshot, entry: TrashRow): void {
  db.prepare(
    `INSERT INTO trash (id, kind, title, path, scene_count, word_count, snapshot, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    entry.id,
    entry.kind,
    entry.title,
    entry.path,
    entry.scene_count,
    entry.word_count,
    JSON.stringify(snapshot),
    entry.deleted_at,
  );
}

/**
 * Puts the entry back. The caller has removed it from the trash table already.
 *
 * A subtree goes to its old place. When the old parent is gone, parts and chapters go to the end
 * of the book and scenes into its last chapter – which is created with `chapterTitle` if the book
 * has none. A note goes back into its group, or into none when the group is gone.
 *
 * Rows that refer to something deleted for good in the meantime (a plot thread, a map …) are left
 * out instead of failing the whole restore. Rows that refer to something still in the trash (a
 * scene link whose note is trashed too) are handed over to that entry, so they come back with it.
 *
 * @returns whether it went back to its old place
 */
export function restoreFromTrash(
  db: DatabaseSync,
  snapshotJson: string,
  chapterTitle: string,
): boolean {
  const snapshot = parse(snapshotJson);
  const keys = foreignKeys(db);
  const others = new OtherEntries(db);

  const atOldPlace =
    snapshot.table === 'nodes'
      ? restoreNodes(db, snapshot.rows.map(load), chapterTitle)
      : restoreNote(db, keys, others, load(snapshot.rows[0]!));

  // A tag of the same name may have been created anew since; the scenes then join that one.
  const tagIds = new Map<SQLInputValue, SQLInputValue>();
  for (const tag of snapshot.tags.map(load)) {
    const existing = db.prepare('SELECT id FROM tags WHERE key = ?').get(tag['key']!) as
      { id: string } | undefined;
    if (!existing) insertRow(db, 'tags', tag);
    tagIds.set(tag['id']!, existing?.id ?? tag['id']!);
  }

  for (const [table, rows] of Object.entries(snapshot.dependents)) {
    if (!tableExists(db, table)) continue;
    for (const stored of rows) {
      const row = load(stored);
      if (table === 'scene_tags') row['tag_id'] = tagIds.get(row['tag_id']!) ?? row['tag_id']!;
      if (settle(db, keys, others, table, row)) insertRow(db, table, row);
    }
  }

  for (const reference of snapshot.references) {
    if (!columnsOf(db, reference.table).includes(reference.column)) continue;
    const key = load(reference.key);
    const where = Object.keys(key)
      .map((column) => `"${column}" = ?`)
      .join(' AND ');
    const params = Object.values(key);
    // Only where nobody pointed it somewhere else in the meantime
    db.prepare(
      `UPDATE "${reference.table}" SET "${reference.column}" = ?
        WHERE ${where} AND "${reference.column}" IS NULL`,
    ).run(reference.value, ...params);
    const exists = db.prepare(`SELECT 1 FROM "${reference.table}" WHERE ${where}`).get(...params);
    if (!exists) others.restoreReference(reference);
  }

  const ftsTable = FTS_TABLE[snapshot.table];
  for (const row of snapshot.fts.map(load)) {
    const columns = Object.keys(row);
    db.prepare(
      `INSERT INTO ${ftsTable} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
    ).run(...Object.values(row));
  }
  others.save();
  return atOldPlace;
}

function restoreNodes(db: DatabaseSync, nodes: Values[], chapterTitle: string): boolean {
  const root = nodes[0]!;
  const kind = root['kind'] as NodeKind;

  let parentId = root['parent_id'] as string | null;
  const atOldPlace =
    parentId === null || db.prepare('SELECT 1 FROM nodes WHERE id = ?').get(parentId) !== undefined;
  if (!atOldPlace) parentId = kind === 'scene' ? lastChapter(db, chapterTitle) : null;

  const siblings = db
    .prepare('SELECT id, sort_order FROM nodes WHERE parent_id IS ? ORDER BY sort_order')
    .all(parentId) as Array<{ id: string; sort_order: number }>;
  const index = atOldPlace
    ? siblings.filter((sibling) => sibling.sort_order < (root['sort_order'] as number)).length
    : siblings.length;

  insertRow(db, 'nodes', { ...root, parent_id: parentId });
  for (const node of nodes.slice(1)) insertRow(db, 'nodes', node);
  const order = siblings.map((sibling) => sibling.id);
  order.splice(index, 0, root['id'] as string);
  const setOrder = db.prepare('UPDATE nodes SET sort_order = ? WHERE id = ?');
  order.forEach((id, position) => setOrder.run(position + 1, id));
  return atOldPlace;
}

function restoreNote(
  db: DatabaseSync,
  keys: ForeignKey[],
  others: OtherEntries,
  note: Values,
): boolean {
  const groupId = note['group_id'] ?? null;
  settle(db, keys, others, 'notes', note);
  insertRow(db, 'notes', note);
  return (note['group_id'] ?? null) === groupId;
}

/**
 * Makes the row fit what exists now. A SET NULL reference to something gone is cleared, any other
 * one keeps the row out. Where that something is in the trash, the row or reference goes there.
 *
 * @returns whether the row can be inserted
 */
function settle(
  db: DatabaseSync,
  keys: ForeignKey[],
  others: OtherEntries,
  table: string,
  row: Values,
): boolean {
  const missing = keys.filter(
    (key) => key.table === table && key.column in row && !targetExists(db, key, row[key.column]),
  );
  const required = missing.find((key) => key.onDelete !== 'SET NULL');
  if (required) {
    others.holding(required.target, row[required.column])?.addDependent(table, row);
    return false;
  }
  for (const key of missing) {
    const value = row[key.column] as string;
    row[key.column] = null;
    others.holding(key.target, value)?.addReference({
      table,
      column: key.column,
      key: store(primaryKey(db, table, row) as Row),
      value,
    });
  }
  return true;
}

/** The other trash entries, read and written back only when a restore hands something over. */
class OtherEntries {
  private entries?: Array<{ id: string; snapshot: Snapshot; ids: Set<unknown>; changed: boolean }>;

  constructor(private readonly db: DatabaseSync) {}

  /** The entry whose deleted rows include this one. */
  holding(table: string, id: SQLInputValue | undefined) {
    const entry = this.all().find((e) => e.snapshot.table === table && e.ids.has(id));
    if (!entry) return undefined;
    return {
      addDependent: (dependentTable: string, row: Values) => {
        (entry.snapshot.dependents[dependentTable] ??= []).push(store(row as Row));
        entry.changed = true;
      },
      addReference: (reference: StoredReference) => {
        entry.snapshot.references.push(reference);
        entry.changed = true;
      },
    };
  }

  /** The row that lost its reference is in the trash itself (e.g. the station of a trashed note). */
  restoreReference(reference: StoredReference): void {
    const key = Object.entries(reference.key);
    for (const entry of this.all()) {
      for (const row of entry.snapshot.dependents[reference.table] ?? []) {
        if (
          key.every(([column, value]) => row[column] === value) &&
          row[reference.column] === null
        ) {
          row[reference.column] = reference.value;
          entry.changed = true;
        }
      }
    }
  }

  save(): void {
    const update = this.db.prepare('UPDATE trash SET snapshot = ? WHERE id = ?');
    for (const entry of this.entries ?? []) {
      if (entry.changed) update.run(JSON.stringify(entry.snapshot), entry.id);
    }
  }

  private all() {
    return (this.entries ??= (
      this.db.prepare('SELECT id, snapshot FROM trash').all() as Array<{
        id: string;
        snapshot: string;
      }>
    ).map((row) => {
      const snapshot = parse(row.snapshot);
      return {
        id: row.id,
        snapshot,
        ids: new Set(snapshot.rows.map((stored) => stored['id'])),
        changed: false,
      };
    }));
  }
}

/** Image ids the trashed rows refer to – they may only be cleaned up once these are gone for good. */
export function imageIdsIn(snapshotJson: string): string[] {
  const inText = [...snapshotJson.matchAll(/\/api\/images\/([0-9a-f-]+)/g)].map((m) => m[1]!);
  const inGallery = (parse(snapshotJson).dependents['note_images'] ?? []).map(
    (row) => row['image_id'] as string,
  );
  return [...new Set([...inText, ...inGallery])];
}

function parse(json: string): Snapshot {
  const snapshot = JSON.parse(json) as Snapshot | SnapshotV1;
  if (snapshot.version === 2) return snapshot;
  const { nodes, ...rest } = snapshot;
  return { ...rest, version: 2, table: 'nodes', rows: nodes };
}

function subtreeIds(db: DatabaseSync, nodeId: string): string[] {
  return (
    db
      .prepare(
        `WITH RECURSIVE subtree(id, depth) AS (
           SELECT ?, 0
           UNION ALL SELECT n.id, s.depth + 1 FROM nodes n JOIN subtree s ON n.parent_id = s.id
         )
         SELECT s.id FROM subtree s JOIN nodes n ON n.id = s.id ORDER BY s.depth, n.sort_order`,
      )
      .all(nodeId) as Array<{ id: string }>
  ).map((row) => row.id);
}

function ancestorTitles(db: DatabaseSync, parentId: string | null): string[] {
  const titles: string[] = [];
  const parentOf = db.prepare('SELECT parent_id, title FROM nodes WHERE id = ?');
  for (let id = parentId; id !== null;) {
    const row = parentOf.get(id) as { parent_id: string | null; title: string } | undefined;
    if (!row) break;
    titles.unshift(row.title);
    id = row.parent_id;
  }
  return titles;
}

function lastChapter(db: DatabaseSync, title: string): string {
  // Chapters inside a part sort by the part's position first, top-level ones by their own
  const last = db
    .prepare(
      `SELECT c.id FROM nodes c LEFT JOIN nodes p ON p.id = c.parent_id
        WHERE c.kind = 'chapter'
        ORDER BY COALESCE(p.sort_order, c.sort_order) DESC,
                 CASE WHEN p.id IS NULL THEN 0 ELSE c.sort_order END DESC
        LIMIT 1`,
    )
    .get() as { id: string } | undefined;
  if (last) return last.id;
  const id = randomUUID();
  const now = nowIso();
  db.prepare(
    `INSERT INTO nodes (id, parent_id, kind, title, sort_order, created_at, updated_at)
     VALUES (?, NULL, 'chapter', ?,
             (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM nodes WHERE parent_id IS NULL), ?, ?)`,
  ).run(id, title, now, now);
  return id;
}

function foreignKeys(db: DatabaseSync): ForeignKey[] {
  return db
    .prepare(
      `SELECT m.name AS "table", f."from" AS "column", f."table" AS target,
              COALESCE(f."to", 'id') AS targetColumn, f.on_delete AS onDelete
         FROM sqlite_master m, pragma_foreign_key_list(m.name) f
        WHERE m.type = 'table'`,
    )
    .all() as unknown as ForeignKey[];
}

function targetExists(
  db: DatabaseSync,
  key: ForeignKey,
  value: SQLInputValue | undefined,
): boolean {
  if (value === null || value === undefined) return true;
  return (
    db.prepare(`SELECT 1 FROM "${key.target}" WHERE "${key.targetColumn}" = ?`).get(value) !==
    undefined
  );
}

function tableExists(db: DatabaseSync, table: string): boolean {
  return (
    db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table) !==
    undefined
  );
}

function columnsOf(db: DatabaseSync, table: string): string[] {
  return (
    db.prepare('SELECT name FROM pragma_table_info(?)').all(table) as Array<{ name: string }>
  ).map((row) => row.name);
}

function primaryKey(db: DatabaseSync, table: string, row: Row | Values): Row {
  const columns = (
    db
      .prepare('SELECT name FROM pragma_table_info(?) WHERE pk > 0 ORDER BY pk')
      .all(table) as Array<{ name: string }>
  ).map((column) => column.name);
  return Object.fromEntries(columns.map((column) => [column, row[column]!])) as Row;
}

/**
 * Columns dropped by a later migration are left out; added ones take their default. Rows that
 * exist already (e.g. a link that was recreated by hand) are kept as they are.
 */
function insertRow(db: DatabaseSync, table: string, row: Values): void {
  const existing = new Set(columnsOf(db, table));
  const columns = Object.keys(row).filter((column) => existing.has(column));
  db.prepare(
    `INSERT OR IGNORE INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')})
     VALUES (${columns.map(() => '?').join(', ')})`,
  ).run(...columns.map((column) => row[column]!));
}

function store(row: Row): StoredRow {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      value instanceof Uint8Array ? { blob: Buffer.from(value).toString('base64') } : value,
    ]),
  ) as StoredRow;
}

function load(row: StoredRow): Values {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      value !== null && typeof value === 'object' ? Buffer.from(value.blob, 'base64') : value,
    ]),
  );
}
