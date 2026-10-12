import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateNodeRequest,
  EditorDoc,
  ManuscriptNode,
  MoveNodeRequest,
  NodeKind,
  SaveSceneContentRequest,
  SceneContent,
  UpdateNodeRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ProjectService } from '../project/project.service.js';

/** Welche Knotenart unter welcher Elternart liegen darf (`null` = oberste Ebene). */
const ALLOWED_PARENTS: Record<NodeKind, ReadonlyArray<NodeKind | null>> = {
  part: [null],
  chapter: [null, 'part'],
  scene: ['chapter'],
};

interface NodeRow {
  id: string;
  parent_id: string | null;
  kind: NodeKind;
  title: string;
  sort_order: number;
  word_count: number;
}

@Injectable()
export class ManuscriptService {
  constructor(private readonly projects: ProjectService) {}

  private get db() {
    return this.projects.db;
  }

  // -------------------------------------------------------------------------
  // Baum
  // -------------------------------------------------------------------------

  list(): ManuscriptNode[] {
    const rows = this.db
      .prepare(
        `SELECT n.id, n.parent_id, n.kind, n.title, n.sort_order, COALESCE(c.word_count, 0) AS word_count
           FROM nodes n
           LEFT JOIN scene_content c ON c.node_id = n.id
          ORDER BY n.sort_order`,
      )
      .all() as unknown as NodeRow[];
    return rows.map(toNode);
  }

  create(request: CreateNodeRequest): ManuscriptNode {
    const kind = requireKind(request.kind);
    const title = requireTitle(request.title);
    const parentId = request.parentId ?? null;
    this.assertValidParent(kind, parentId);

    const id = randomUUID();
    const now = nowIso();
    transaction(this.db, () => {
      const { next } = this.db
        .prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM nodes WHERE parent_id IS ?')
        .get(parentId) as { next: number };
      this.db
        .prepare(
          `INSERT INTO nodes (id, parent_id, kind, title, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(id, parentId, kind, title, next, now, now);
      this.projects.touch();
    });
    return this.get(id);
  }

  update(id: string, request: UpdateNodeRequest): ManuscriptNode {
    const node = this.get(id);
    const title = request.title === undefined ? node.title : requireTitle(request.title);
    if (title === node.title) {
      return node;
    }
    transaction(this.db, () => {
      this.db
        .prepare('UPDATE nodes SET title = ?, updated_at = ? WHERE id = ?')
        .run(title, nowIso(), id);
      this.db.prepare('UPDATE scene_fts SET title = ? WHERE node_id = ?').run(title, id);
      this.projects.touch();
    });
    return this.get(id);
  }

  /**
   * Verschiebt einen Knoten samt Unterknoten. Die Geschwister am Ziel werden dabei
   * neu durchnummeriert (1, 2, 3 …), damit die Reihenfolge nie „ausfranst“.
   *
   * @returns der komplette, aktualisierte Baum
   */
  move(id: string, request: MoveNodeRequest): ManuscriptNode[] {
    const node = this.get(id);
    const parentId = request?.parentId ?? null;
    const beforeId = request?.beforeId ?? null;
    if (parentId === id || beforeId === id) {
      throw new BadRequestException(
        'Ein Element kann nicht in oder vor sich selbst verschoben werden.',
      );
    }
    this.assertValidParent(node.kind, parentId);

    transaction(this.db, () => {
      const siblings = (
        this.db
          .prepare('SELECT id FROM nodes WHERE parent_id IS ? AND id != ? ORDER BY sort_order')
          .all(parentId, id) as Array<{ id: string }>
      ).map((row) => row.id);

      const index = beforeId === null ? siblings.length : siblings.indexOf(beforeId);
      if (index < 0) {
        throw new BadRequestException('Das Bezugselement liegt nicht an der Zielposition.');
      }
      siblings.splice(index, 0, id);

      const now = nowIso();
      this.db
        .prepare('UPDATE nodes SET parent_id = ?, updated_at = ? WHERE id = ?')
        .run(parentId, now, id);
      const setOrder = this.db.prepare('UPDATE nodes SET sort_order = ? WHERE id = ?');
      siblings.forEach((siblingId, position) => setOrder.run(position + 1, siblingId));
      this.projects.touch();
    });
    return this.list();
  }

  /** Löscht den Knoten mitsamt allen Unterknoten und Inhalten. */
  remove(id: string): void {
    this.get(id);
    transaction(this.db, () => {
      // Die FTS-Tabelle kennt keine Fremdschlüssel, daher von Hand aufräumen.
      this.db
        .prepare(
          `WITH RECURSIVE subtree(id) AS (
             SELECT ? UNION ALL SELECT n.id FROM nodes n JOIN subtree s ON n.parent_id = s.id
           )
           DELETE FROM scene_fts WHERE node_id IN (SELECT id FROM subtree)`,
        )
        .run(id);
      this.db.prepare('DELETE FROM nodes WHERE id = ?').run(id);
      this.projects.touch();
    });
  }

  // -------------------------------------------------------------------------
  // Szeneninhalt
  // -------------------------------------------------------------------------

  getContent(nodeId: string): SceneContent {
    this.requireScene(nodeId);
    const row = this.db
      .prepare('SELECT doc, word_count, updated_at FROM scene_content WHERE node_id = ?')
      .get(nodeId) as { doc: string; word_count: number; updated_at: string } | undefined;
    return {
      nodeId,
      doc: row ? (JSON.parse(row.doc) as EditorDoc) : null,
      wordCount: row?.word_count ?? 0,
      updatedAt: row?.updated_at ?? null,
    };
  }

  saveContent(nodeId: string, request: SaveSceneContentRequest): SceneContent {
    const node = this.requireScene(nodeId);
    if (request?.doc?.type !== 'doc') {
      throw new BadRequestException('Ungültiges Dokument.');
    }
    const wordCount =
      Number.isInteger(request.wordCount) && request.wordCount >= 0 ? request.wordCount : 0;
    const text = typeof request.text === 'string' ? request.text : '';
    const now = nowIso();

    transaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO scene_content (node_id, doc, word_count, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT (node_id) DO UPDATE SET doc = excluded.doc, word_count = excluded.word_count, updated_at = excluded.updated_at`,
        )
        .run(nodeId, JSON.stringify(request.doc), wordCount, now);
      this.db.prepare('DELETE FROM scene_fts WHERE node_id = ?').run(nodeId);
      this.db
        .prepare('INSERT INTO scene_fts (node_id, title, body) VALUES (?, ?, ?)')
        .run(nodeId, node.title, text);
      this.projects.touch();
    });

    return { nodeId, doc: request.doc, wordCount, updatedAt: now };
  }

  // -------------------------------------------------------------------------

  private get(id: string): ManuscriptNode {
    const row = this.db
      .prepare(
        `SELECT n.id, n.parent_id, n.kind, n.title, n.sort_order, COALESCE(c.word_count, 0) AS word_count
           FROM nodes n
           LEFT JOIN scene_content c ON c.node_id = n.id
          WHERE n.id = ?`,
      )
      .get(id) as NodeRow | undefined;
    if (!row) {
      throw new NotFoundException('Element nicht gefunden.');
    }
    return toNode(row);
  }

  private requireScene(id: string): ManuscriptNode {
    const node = this.get(id);
    if (node.kind !== 'scene') {
      throw new BadRequestException('Nur Szenen haben Textinhalt.');
    }
    return node;
  }

  private assertValidParent(kind: NodeKind, parentId: string | null): void {
    const parentKind = parentId === null ? null : this.get(parentId).kind;
    if (!ALLOWED_PARENTS[kind].includes(parentKind)) {
      throw new BadRequestException(
        `Ein Element vom Typ „${kind}“ kann hier nicht eingefügt werden.`,
      );
    }
  }
}

function toNode(row: NodeRow): ManuscriptNode {
  return {
    id: row.id,
    parentId: row.parent_id,
    kind: row.kind,
    title: row.title,
    sortOrder: row.sort_order,
    wordCount: row.word_count,
  };
}

function requireKind(kind: unknown): NodeKind {
  if (kind !== 'part' && kind !== 'chapter' && kind !== 'scene') {
    throw new BadRequestException('Unbekannter Elementtyp.');
  }
  return kind;
}

function requireTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new BadRequestException('Der Titel darf nicht leer sein.');
  }
  return title.trim();
}
