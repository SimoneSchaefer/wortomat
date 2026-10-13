import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AnnotationCounts,
  CreateNodeRequest,
  EditorDoc,
  ManuscriptNode,
  MoveNodeRequest,
  NodeKind,
  SaveDocumentRequest,
  SceneContent,
  SceneReference,
  SceneStatus,
  SceneText,
  UpdateNodeRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ProjectService } from '../project/project.service.js';
import { WritingLogService } from '../writing-log/writing-log.service.js';
import { countAnnotations } from './annotations.js';
import { localized } from '../i18n.js';

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
  status: SceneStatus;
  word_count: number;
  todo_count: number;
  idea_count: number;
  fixme_count: number;
  turning_point: number;
  story_order: number | null;
}

@Injectable()
export class ManuscriptService {
  constructor(
    private readonly projects: ProjectService,
    private readonly writingLog: WritingLogService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  // -------------------------------------------------------------------------
  // Baum
  // -------------------------------------------------------------------------

  list(): ManuscriptNode[] {
    const rows = this.db
      .prepare(
        `SELECT n.id, n.parent_id, n.kind, n.title, n.sort_order, n.status, n.turning_point, n.story_order, COALESCE(c.word_count, 0) AS word_count,
                COALESCE(c.todo_count, 0) AS todo_count, COALESCE(c.idea_count, 0) AS idea_count,
                COALESCE(c.fixme_count, 0) AS fixme_count
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
      if (kind === 'scene') this.inheritStrands(id);
      this.projects.touch();
    });
    return this.get(id);
  }

  update(id: string, request: UpdateNodeRequest): ManuscriptNode {
    const node = this.get(id);
    const title = request?.title === undefined ? node.title : requireTitle(request.title);
    let status = node.status;
    if (request?.status !== undefined) {
      if (node.kind !== 'scene') {
        throw new BadRequestException(
          localized('Nur Szenen haben einen Status.', 'Only scenes have a status.'),
        );
      }
      status = requireStatus(request.status);
    }
    let turningPoint = node.turningPoint;
    if (request?.turningPoint !== undefined) {
      if (node.kind !== 'scene') {
        throw new BadRequestException(
          localized('Nur Szenen können Wendepunkte sein.', 'Only scenes can be turning points.'),
        );
      }
      if (typeof request.turningPoint !== 'boolean') {
        throw new BadRequestException(localized('Ungültiger Wert.', 'Invalid value.'));
      }
      turningPoint = request.turningPoint;
    }
    if (title === node.title && status === node.status && turningPoint === node.turningPoint) {
      return node;
    }
    transaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE nodes SET title = ?, status = COALESCE(?, status),
                  turning_point = COALESCE(?, turning_point), updated_at = ? WHERE id = ?`,
        )
        .run(title, status, turningPoint === null ? null : Number(turningPoint), nowIso(), id);
      if (title !== node.title) {
        this.db.prepare('UPDATE scene_fts SET title = ? WHERE node_id = ?').run(title, id);
      }
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
        localized(
          'Ein Element kann nicht in oder vor sich selbst verschoben werden.',
          'An item cannot be moved into or before itself.',
        ),
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
        throw new BadRequestException(
          localized(
            'Das Bezugselement liegt nicht an der Zielposition.',
            'The reference item is not at the target position.',
          ),
        );
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
      .prepare(
        `SELECT doc, word_count, todo_count, idea_count, fixme_count, updated_at
           FROM scene_content WHERE node_id = ?`,
      )
      .get(nodeId) as
      | {
          doc: string;
          word_count: number;
          todo_count: number;
          idea_count: number;
          fixme_count: number;
          updated_at: string;
        }
      | undefined;
    return {
      nodeId,
      doc: row ? (JSON.parse(row.doc) as EditorDoc) : null,
      wordCount: row?.word_count ?? 0,
      annotations: row ? annotationCounts(row) : { todo: 0, idea: 0, fixme: 0 },
      updatedAt: row?.updated_at ?? null,
    };
  }

  /** Reiner Text aller Szenen – steht als solcher im Suchindex. */
  texts(): SceneText[] {
    return this.db
      .prepare(
        `SELECT f.node_id AS sceneId, f.body AS text
           FROM scene_fts f JOIN nodes n ON n.id = f.node_id
          WHERE n.kind = 'scene'`,
      )
      .all() as unknown as SceneText[];
  }

  saveContent(nodeId: string, request: SaveDocumentRequest): SceneContent {
    const node = this.requireScene(nodeId);
    if (request?.doc?.type !== 'doc') {
      throw new BadRequestException(localized('Ungültiges Dokument.', 'Invalid document.'));
    }
    const wordCount =
      Number.isInteger(request.wordCount) && request.wordCount >= 0 ? request.wordCount : 0;
    const text = typeof request.text === 'string' ? request.text : '';
    // Selbst zählen statt dem Client zu glauben – das Dokument ist die Wahrheit.
    const annotations = countAnnotations(request.doc);
    const now = nowIso();

    transaction(this.db, () => {
      // Der bisherige Text steht im Suchindex – daraus ergibt sich, was neu geschrieben wurde.
      const before = this.db.prepare('SELECT body FROM scene_fts WHERE node_id = ?').get(nodeId) as
        { body: string } | undefined;
      this.writingLog.record(nodeId, before?.body ?? '', text, request.pastedWords ?? 0);
      this.db
        .prepare(
          `INSERT INTO scene_content
             (node_id, doc, word_count, todo_count, idea_count, fixme_count, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (node_id) DO UPDATE SET
             doc = excluded.doc, word_count = excluded.word_count,
             todo_count = excluded.todo_count, idea_count = excluded.idea_count,
             fixme_count = excluded.fixme_count, updated_at = excluded.updated_at`,
        )
        .run(
          nodeId,
          JSON.stringify(request.doc),
          wordCount,
          annotations.todo,
          annotations.idea,
          annotations.fixme,
          now,
        );
      this.db.prepare('DELETE FROM scene_fts WHERE node_id = ?').run(nodeId);
      this.db
        .prepare('INSERT INTO scene_fts (node_id, title, body) VALUES (?, ?, ?)')
        .run(nodeId, node.title, text);
      this.projects.touch();
    });

    return { nodeId, doc: request.doc, wordCount, annotations, updatedAt: now };
  }

  /**
   * Ersetzt das Dokument einer Szene, deren Text gleich bleibt – z. B. wenn nur Markierungen
   * dazukommen. Suchindex, Wortzahl und Schreib-Log bleiben daher, wie sie sind.
   */
  replaceMarkedDoc(nodeId: string, doc: EditorDoc): void {
    this.requireScene(nodeId);
    const annotations = countAnnotations(doc);
    this.db
      .prepare(
        `UPDATE scene_content
            SET doc = ?, todo_count = ?, idea_count = ?, fixme_count = ?, updated_at = ?
          WHERE node_id = ?`,
      )
      .run(
        JSON.stringify(doc),
        annotations.todo,
        annotations.idea,
        annotations.fixme,
        nowIso(),
        nodeId,
      );
  }

  // -------------------------------------------------------------------------

  private get(id: string): ManuscriptNode {
    const row = this.db
      .prepare(
        `SELECT n.id, n.parent_id, n.kind, n.title, n.sort_order, n.status, n.turning_point, n.story_order, COALESCE(c.word_count, 0) AS word_count,
                COALESCE(c.todo_count, 0) AS todo_count, COALESCE(c.idea_count, 0) AS idea_count,
                COALESCE(c.fixme_count, 0) AS fixme_count
           FROM nodes n
           LEFT JOIN scene_content c ON c.node_id = n.id
          WHERE n.id = ?`,
      )
      .get(id) as NodeRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Element nicht gefunden.', 'Item not found.'));
    }
    return toNode(row);
  }

  /**
   * Die angegebenen Szenen in der Reihenfolge, in der sie im Manuskript stehen,
   * jeweils mit dem Pfad aus Teil- und Kapiteltiteln.
   */
  sceneReferences(sceneIds: ReadonlySet<string>): SceneReference[] {
    const nodes = this.list();
    const children = new Map<string | null, ManuscriptNode[]>();
    for (const node of nodes) {
      const siblings = children.get(node.parentId) ?? [];
      siblings.push(node);
      children.set(node.parentId, siblings);
    }

    const result: SceneReference[] = [];
    const visit = (parentId: string | null, path: string[]) => {
      const siblings = (children.get(parentId) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of siblings) {
        if (node.kind === 'scene') {
          if (sceneIds.has(node.id)) result.push({ id: node.id, title: node.title, path });
        } else {
          visit(node.id, [...path, node.title]);
        }
      }
    };
    visit(null, []);
    return result;
  }

  /**
   * Eine neue Szene gehört zu denselben Strängen wie die Szene davor (in Buchreihenfolge) –
   * meist erzählt man einen Strang über mehrere Szenen weiter.
   */
  private inheritStrands(sceneId: string): void {
    const scenes = scenesInOrder(this.list());
    const index = scenes.findIndex((scene) => scene.id === sceneId);
    const previous = index > 0 ? scenes[index - 1] : undefined;
    if (!previous) return;
    this.db
      .prepare(
        `INSERT INTO scene_strands (scene_id, strand_id)
         SELECT ?, strand_id FROM scene_strands WHERE scene_id = ?`,
      )
      .run(sceneId, previous.id);
  }

  requireScene(id: string): ManuscriptNode {
    const node = this.get(id);
    if (node.kind !== 'scene') {
      throw new BadRequestException(
        localized('Nur Szenen haben Textinhalt.', 'Only scenes have text content.'),
      );
    }
    return node;
  }

  private assertValidParent(kind: NodeKind, parentId: string | null): void {
    const parentKind = parentId === null ? null : this.get(parentId).kind;
    if (!ALLOWED_PARENTS[kind].includes(parentKind)) {
      throw new BadRequestException(
        localized(
          `Ein Element vom Typ „${kind}“ kann hier nicht eingefügt werden.`,
          `An item of type “${kind}” cannot be inserted here.`,
        ),
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
    status: row.kind === 'scene' ? row.status : null,
    annotations: row.kind === 'scene' ? annotationCounts(row) : null,
    turningPoint: row.kind === 'scene' ? row.turning_point === 1 : null,
    storyOrder: row.kind === 'scene' ? row.story_order : null,
  };
}

/** Alle Szenen in der Reihenfolge, in der sie im Buch stehen. */
function scenesInOrder(nodes: readonly ManuscriptNode[]): ManuscriptNode[] {
  const children = new Map<string | null, ManuscriptNode[]>();
  for (const node of nodes) {
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  }
  const result: ManuscriptNode[] = [];
  const visit = (parentId: string | null) => {
    const siblings = (children.get(parentId) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    for (const node of siblings) {
      if (node.kind === 'scene') result.push(node);
      else visit(node.id);
    }
  };
  visit(null);
  return result;
}

function annotationCounts(row: {
  todo_count: number;
  idea_count: number;
  fixme_count: number;
}): AnnotationCounts {
  return { todo: row.todo_count, idea: row.idea_count, fixme: row.fixme_count };
}

function requireKind(kind: unknown): NodeKind {
  if (kind !== 'part' && kind !== 'chapter' && kind !== 'scene') {
    throw new BadRequestException(localized('Unbekannter Elementtyp.', 'Unknown item type.'));
  }
  return kind;
}

const SCENE_STATUSES: readonly SceneStatus[] = ['idea', 'outline', 'draft', 'revised', 'final'];

function requireStatus(status: unknown): SceneStatus {
  if (!SCENE_STATUSES.includes(status as SceneStatus)) {
    throw new BadRequestException(localized('Unbekannter Status.', 'Unknown status.'));
  }
  return status as SceneStatus;
}

function requireTitle(title: unknown): string {
  if (typeof title !== 'string' || !title.trim()) {
    throw new BadRequestException(
      localized('Der Titel darf nicht leer sein.', 'The title must not be empty.'),
    );
  }
  return title.trim();
}
