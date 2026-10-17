import { computed, inject, Injectable, signal } from '@angular/core';
import type {
  AnnotationCounts,
  ArrangeScenesRequest,
  CreateNodeRequest,
  ManuscriptNode,
  MoveNodeRequest,
  ProjectInfo,
  RestoreResult,
  SaveStoryRequest,
  SceneStatus,
  StoryMark,
  TrashEntry,
} from '@wortomat/shared';
import { addCounts, NO_ANNOTATIONS } from './annotations';
import { WortomatApi } from './wortomat-api';

export interface TreeItem {
  node: ManuscriptNode;
  children: TreeItem[];
  /** For scenes their own marks, for chapters/parts the sum below. */
  annotations: AnnotationCounts;
  /** For scenes their own word count, for chapters/parts the sum below. */
  wordCount: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly api = inject(WortomatApi);
  private initialLoad: Promise<ProjectInfo | null> | null = null;

  readonly project = signal<ProjectInfo | null>(null);
  readonly nodes = signal<ManuscriptNode[]>([]);
  readonly tree = computed(() => buildTree(this.nodes()));
  readonly totalWords = computed(() => this.nodes().reduce((sum, node) => sum + node.wordCount, 0));
  readonly trash = signal<TrashEntry[]>([]);
  /** Display only, valid until the project is closed. */
  readonly collapsed = signal<ReadonlySet<string>>(new Set());

  /**
   * On the first call the backend is asked (a project may already be open, e.g. started by
   * double-click); after that the store's state applies, updated on create/open/close.
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
    this.trash.set(project ? await this.api.listTrash() : []);
    return project;
  }

  async create(filePath: string, title: string): Promise<void> {
    this.project.set(await this.api.createProject({ filePath, title }));
    this.nodes.set([]);
    this.trash.set([]);
    this.collapsed.set(new Set());
  }

  async open(filePath: string): Promise<void> {
    this.project.set(await this.api.openProject(filePath));
    this.nodes.set(await this.api.listNodes());
    this.trash.set(await this.api.listTrash());
    this.collapsed.set(new Set());
  }

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
    this.trash.set([]);
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

  /** Returns the section marks. */
  async saveStory(request: SaveStoryRequest): Promise<StoryMark[]> {
    const state = await this.api.saveStory(request);
    this.nodes.set(state.nodes);
    return state.marks;
  }

  /** E.g. after marks were added from outside. */
  async reloadNodes(): Promise<void> {
    this.nodes.set(await this.api.listNodes());
  }

  async arrangeScenes(request: ArrangeScenesRequest): Promise<void> {
    this.nodes.set(await this.api.arrangeScenes(request));
  }

  async moveNode(id: string, request: MoveNodeRequest): Promise<void> {
    this.nodes.set(await this.api.moveNode(id, request));
  }

  /** Into the trash, with everything below it. */
  async deleteNode(id: string): Promise<void> {
    await this.api.deleteNode(id);
    const [nodes, trash] = await Promise.all([this.api.listNodes(), this.api.listTrash()]);
    this.nodes.set(nodes);
    this.trash.set(trash);
  }

  async restoreFromTrash(id: string): Promise<RestoreResult> {
    const result = await this.api.restoreFromTrash(id);
    this.nodes.set(result.nodes);
    this.trash.update((entries) => entries.filter((entry) => entry.id !== id));
    this.reveal(id);
    return result;
  }

  async deleteFromTrash(id: string): Promise<void> {
    await this.api.deleteFromTrash(id);
    this.trash.update((entries) => entries.filter((entry) => entry.id !== id));
  }

  async emptyTrash(): Promise<void> {
    await this.api.emptyTrash();
    this.trash.set([]);
  }

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

  /** Expands everything above the element – e.g. when a scene is opened. */
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
