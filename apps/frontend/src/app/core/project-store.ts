import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  AnnotationCounts,
  CreateNodeRequest,
  ManuscriptNode,
  MoveNodeRequest,
  ProjectInfo,
  SceneStatus,
} from '@wortomat/shared';
import { addCounts, NO_ANNOTATIONS } from './annotations';
import { WortomatApi } from './wortomat-api';

export interface TreeItem {
  node: ManuscriptNode;
  children: TreeItem[];
  /** Bei Szenen deren Markierungen, bei Kapiteln/Teilen die Summe darunter. */
  annotations: AnnotationCounts;
  /** Bei Szenen deren Wortzahl, bei Kapiteln/Teilen die Summe darunter. */
  wordCount: number;
}

/** Zustand des geöffneten Projekts: Metadaten und Manuskript-Baum. */
@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly api = inject(WortomatApi);
  private initialLoad: Promise<ProjectInfo | null> | null = null;

  readonly project = signal<ProjectInfo | null>(null);
  readonly nodes = signal<ManuscriptNode[]>([]);
  readonly tree = computed(() => buildTree(this.nodes()));
  readonly totalWords = computed(() => this.nodes().reduce((sum, node) => sum + node.wordCount, 0));
  /** Eingeklappte Teile und Kapitel im Baum – nur Anzeige, gilt bis zum Schließen des Projekts. */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());

  /**
   * Liefert das aktuell geöffnete Projekt. Beim ersten Aufruf wird das Backend gefragt
   * (es kann schon ein Projekt offen sein, z. B. per Doppelklick gestartet); danach gilt
   * der Zustand des Stores, der bei create/open/close aktualisiert wird.
   */
  async ensureLoaded(): Promise<ProjectInfo | null> {
    this.initialLoad ??= this.reload();
    await this.initialLoad;
    return this.project();
  }

  async reload(): Promise<ProjectInfo | null> {
    const project = await this.api.currentProject();
    this.project.set(project);
    this.nodes.set(project ? await this.api.listNodes() : []);
    return project;
  }

  async create(filePath: string, title: string): Promise<void> {
    this.project.set(await this.api.createProject({ filePath, title }));
    this.nodes.set([]);
    this.collapsed.set(new Set());
  }

  async open(filePath: string): Promise<void> {
    this.project.set(await this.api.openProject(filePath));
    this.nodes.set(await this.api.listNodes());
    this.collapsed.set(new Set());
  }

  /** Titelbild setzen (hochgeladenes Bild) oder mit `null` entfernen. */
  /** Titel und/oder Autor des Buchs ändern. */
  async updateDetails(changes: { title?: string; author?: string }): Promise<void> {
    this.project.set(await this.api.updateProject(changes));
  }

  async setCover(imageId: string | null): Promise<void> {
    this.project.set(await this.api.updateProject({ coverImageId: imageId }));
  }

  async close(): Promise<void> {
    await this.api.closeProject();
    this.project.set(null);
    this.nodes.set([]);
    this.collapsed.set(new Set());
  }

  async addNode(request: CreateNodeRequest): Promise<ManuscriptNode> {
    const node = await this.api.createNode(request);
    this.nodes.update((nodes) => [...nodes, node]);
    return node;
  }

  async renameNode(id: string, title: string): Promise<void> {
    const updated = await this.api.updateNode(id, { title });
    this.nodes.update((nodes) => nodes.map((node) => (node.id === id ? updated : node)));
  }

  async setStatus(id: string, status: SceneStatus): Promise<void> {
    const updated = await this.api.updateNode(id, { status });
    this.nodes.update((nodes) => nodes.map((node) => (node.id === id ? updated : node)));
  }

  async setTurningPoint(id: string, turningPoint: boolean): Promise<void> {
    const updated = await this.api.updateNode(id, { turningPoint });
    this.nodes.update((nodes) => nodes.map((node) => (node.id === id ? updated : node)));
  }

  async moveNode(id: string, request: MoveNodeRequest): Promise<void> {
    this.nodes.set(await this.api.moveNode(id, request));
  }

  async deleteNode(id: string): Promise<void> {
    await this.api.deleteNode(id);
    // Unterknoten werden im Backend mitgelöscht; einfach neu laden.
    this.nodes.set(await this.api.listNodes());
  }

  /** Nach dem Speichern einer Szene: Wortzahl und Markierungen im Baum aktualisieren. */
  updateSceneStats(id: string, wordCount: number, annotations: AnnotationCounts): void {
    this.nodes.update((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, wordCount, annotations } : node)),
    );
  }

  toggleCollapsed(id: string): void {
    this.collapsed.update((collapsed) => {
      const next = new Set(collapsed);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** Klappt alles auf, was über dem Element liegt – z. B. wenn eine Szene geöffnet wird. */
  reveal(id: string): void {
    const collapsed = this.collapsed();
    const next = new Set(collapsed);
    for (let node = this.findNode(id); node?.parentId; node = this.findNode(node.parentId)) {
      next.delete(node.parentId);
    }
    next.delete(id);
    if (next.size !== collapsed.size) this.collapsed.set(next);
  }

  findNode(id: string): ManuscriptNode | undefined {
    return this.nodes().find((node) => node.id === id);
  }
}

export function buildTree(nodes: readonly ManuscriptNode[]): TreeItem[] {
  const items = new Map<string, TreeItem>(
    nodes.map((node) => [
      node.id,
      { node, children: [], annotations: NO_ANNOTATIONS, wordCount: 0 },
    ]),
  );
  const roots: TreeItem[] = [];
  for (const item of items.values()) {
    const parent = item.node.parentId ? items.get(item.node.parentId) : undefined;
    (parent ? parent.children : roots).push(item);
  }
  const finish = (list: TreeItem[]) => {
    list.sort((a, b) => a.node.sortOrder - b.node.sortOrder);
    for (const item of list) {
      finish(item.children);
      item.annotations =
        item.node.annotations ??
        item.children.reduce((sum, child) => addCounts(sum, child.annotations), NO_ANNOTATIONS);
      item.wordCount =
        item.node.kind === 'scene'
          ? item.node.wordCount
          : item.children.reduce((sum, child) => sum + child.wordCount, 0);
    }
  };
  finish(roots);
  return roots;
}
