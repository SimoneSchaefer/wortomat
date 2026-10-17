import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLInputValue, SQLOutputValue } from 'node:sqlite';
import type { NodeKind } from '@wortomat/shared';
import { nowIso } from '../database/sqlite.js';

type Row = Record<string, SQLOutputValue>;
/** Blobs do not survive JSON, so they are stored as base64. */
type StoredValue = string | number | null | { blob: string };
type StoredRow = Record<string, StoredValue>;

/**
 * Everything that deleting a subtree removes or changes. Trashed nodes leave the regular tables
 * completely, so no query elsewhere (tree, search, export, statistics …) has to filter them out.
 * Tables are found through their foreign keys instead of being listed here, so a table added
 * later that refers to nodes is covered without touching this file.
 */
interface Snapshot {
  version: 1;
  /** Parents before their children, so they can be inserted in this order. */
  nodes: StoredRow[];
  /** Rows removed along with the nodes by ON DELETE CASCADE, per table. */
  dependents: Record<string, StoredRow[]>;
  /** Rows that only lost their reference to a node (ON DELETE SET NULL). */
  references: Array<{ table: string; column: string; key: StoredRow; value: string }>;
  /** Unused tags get cleaned up, so the tags of the scenes may be gone when restoring. */
  tags: StoredRow[];
  /** The search index has no foreign key. */
  fts: StoredRow[];
}

interface ForeignKey {
  table: string;
  column: string;
  target: string;
  targetColumn: string;
  onDelete: string;
}

export interface TrashRow {
  id: string;
  kind: NodeKind;
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

  const snapshot: Snapshot = {
    version: 1,
    nodes: nodes.map(store),
    dependents: {},
    references: [],
    tags: (
      db
        .prepare(
          `SELECT DISTINCT t.* FROM tags t JOIN scene_tags st ON st.tag_id = t.id
            WHERE st.scene_id ${inSubtree}`,
        )
        .all(idList) as Row[]
    ).map(store),
    fts: (
      db
        .prepare(`SELECT node_id, title, body FROM scene_fts WHERE node_id ${inSubtree}`)
        .all(idList) as Row[]
    ).map(store),
  };
  for (const key of foreignKeys(db)) {
    if (key.target !== 'nodes' || key.table === 'nodes') continue;
    const rows = db
      .prepare(`SELECT * FROM "${key.table}" WHERE "${key.column}" ${inSubtree}`)
      .all(idList) as Row[];
    if (key.onDelete === 'CASCADE') {
      (snapshot.dependents[key.table] ??= []).push(...rows.map(store));
    } else if (key.onDelete === 'SET NULL') {
      const primaryKey = primaryKeyOf(db, key.table);
      for (const row of rows) {
        snapshot.references.push({
          table: key.table,
          column: key.column,
          key: store(Object.fromEntries(primaryKey.map((column) => [column, row[column]!]))),
          value: row[key.column] as string,
        });
      }
    }
  }

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS scenes, COALESCE(SUM(c.word_count), 0) AS words
         FROM nodes n LEFT JOIN scene_content c ON c.node_id = n.id
        WHERE n.kind = 'scene' AND n.id ${inSubtree}`,
    )
    .get(idList) as { scenes: number; words: number };
  db.prepare(
    `INSERT INTO trash (id, kind, title, path, scene_count, word_count, snapshot, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    nodeId,
    root['kind'] as string,
    root['title'] as string,
    JSON.stringify(ancestorTitles(db, root['parent_id'] as string | null)),
    totals.scenes,
    totals.words,
    JSON.stringify(snapshot),
    nowIso(),
  );
}

/**
 * Puts the subtree back at its old place. When the old parent is gone, parts and chapters go to
 * the end of the book and scenes into its last chapter – which is created with `chapterTitle` if
 * the book has none.
 *
 * Rows that refer to something deleted in the meantime (a character, a plot thread …) are left
 * out instead of failing the whole restore.
 *
 * @returns whether it went back to its old place
 */
export function restoreFromTrash(
  db: DatabaseSync,
  snapshotJson: string,
  chapterTitle: string,
): boolean {
  const snapshot = JSON.parse(snapshotJson) as Snapshot;
  const nodes = snapshot.nodes.map(load);
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

  // A tag of the same name may have been created anew since; the scenes then join that one.
  const tagIds = new Map<SQLInputValue, SQLInputValue>();
  for (const tag of snapshot.tags.map(load)) {
    const existing = db.prepare('SELECT id FROM tags WHERE key = ?').get(tag['key']!) as
      { id: string } | undefined;
    if (!existing) insertRow(db, 'tags', tag);
    tagIds.set(tag['id']!, existing?.id ?? tag['id']!);
  }

  const keys = foreignKeys(db);
  for (const [table, rows] of Object.entries(snapshot.dependents)) {
    if (!tableExists(db, table)) continue;
    const tableKeys = keys.filter((key) => key.table === table);
    for (const stored of rows) {
      const row = load(stored);
      if (table === 'scene_tags') row['tag_id'] = tagIds.get(row['tag_id']!) ?? row['tag_id']!;
      if (tableKeys.every((key) => targetExists(db, key, row[key.column]))) {
        insertRow(db, table, row);
      }
    }
  }

  for (const reference of snapshot.references) {
    if (!columnsOf(db, reference.table).includes(reference.column)) continue;
    const key = load(reference.key);
    const where = Object.keys(key)
      .map((column) => `"${column}" = ?`)
      .join(' AND ');
    // Only where nobody pointed it somewhere else in the meantime
    db.prepare(
      `UPDATE "${reference.table}" SET "${reference.column}" = ?
        WHERE ${where} AND "${reference.column}" IS NULL`,
    ).run(reference.value, ...Object.values(key));
  }

  for (const row of snapshot.fts.map(load)) {
    db.prepare('INSERT INTO scene_fts (node_id, title, body) VALUES (?, ?, ?)').run(
      row['node_id']!,
      row['title']!,
      row['body']!,
    );
  }
  return atOldPlace;
}

/** Image ids the trashed text refers to – they may only be cleaned up once it is gone for good. */
export function imageIdsIn(snapshotJson: string): string[] {
  return [...new Set([...snapshotJson.matchAll(/\/api\/images\/([0-9a-f-]+)/g)].map((m) => m[1]!))];
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

function primaryKeyOf(db: DatabaseSync, table: string): string[] {
  return (
    db
      .prepare('SELECT name FROM pragma_table_info(?) WHERE pk > 0 ORDER BY pk')
      .all(table) as Array<{ name: string }>
  ).map((row) => row.name);
}

/**
 * Columns dropped by a later migration are left out; added ones take their default. Rows that
 * exist already (e.g. a link that was recreated by hand) are kept as they are.
 */
function insertRow(db: DatabaseSync, table: string, row: Record<string, SQLInputValue>): void {
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

function load(row: StoredRow): Record<string, SQLInputValue> {
  return Object.fromEntries(
    Object.entries(row).map(([column, value]) => [
      column,
      value !== null && typeof value === 'object' ? Buffer.from(value.blob, 'base64') : value,
    ]),
  );
}
