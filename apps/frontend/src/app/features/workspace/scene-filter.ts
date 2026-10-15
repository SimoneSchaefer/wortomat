import { computed, inject, Injectable, signal } from '@angular/core';
import type { AnnotationKind, ManuscriptNode, SceneStatus, Strand, Tag } from '@wortomat/shared';
import { addCounts, NO_ANNOTATIONS } from '../../core/annotations';
import { ProjectStore, type TreeItem } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';

/**
 * Within a group one match is enough ("Anna or Ben"), across groups everything must match ("Anna
 * and status draft").
 */
export interface SceneFilterCriteria {
  statuses: readonly SceneStatus[];
  /** Scenes with open todos/ideas/fixmes of these kinds. */
  annotations: readonly AnnotationKind[];
  /** Flags a scene must have (so far only "turning point"). */
  flags: readonly SceneFlag[];
  strandIds: readonly string[];
  /** Characters and places (one group per kind, see `noteKinds`). */
  noteIds: readonly string[];
  tagIds: readonly string[];
}

export type SceneFlag = 'turningPoint';

export type FilterGroup = keyof SceneFilterCriteria;

export const NO_FILTER: SceneFilterCriteria = {
  statuses: [],
  annotations: [],
  flags: [],
  strandIds: [],
  noteIds: [],
  tagIds: [],
};

export interface SceneLinksInfo {
  noteIds: ReadonlySet<string>;
  tags: readonly Tag[];
  strandIds: readonly string[];
}

/**
 * Provided in the workspace: survives switching between areas and only applies to the open project.
 */
@Injectable()
export class SceneFilter {
  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly notes = inject(NotesStore);

  readonly criteria = signal<SceneFilterCriteria>(NO_FILTER);
  /** Loaded fresh whenever the filter opens. */
  readonly links = signal<ReadonlyMap<string, SceneLinksInfo>>(new Map());
  /** Threads with at least one scene – in their order. */
  readonly strands = signal<readonly Strand[]>([]);

  readonly active = computed(() => activeCount(this.criteria()) > 0);
  readonly activeCount = computed(() => activeCount(this.criteria()));

  /** As displayed – while filtering, only with matching scenes. */
  readonly tree = computed(() => {
    const tree = this.store.tree();
    if (!this.active()) return tree;
    const criteria = this.criteria();
    const links = this.links();
    const noteKindOf = (id: string) => this.notes.find(id)?.kind;
    return filterTree(tree, (node) => matchesScene(node, criteria, links.get(node.id), noteKindOf));
  });
  readonly shownCount = computed(() => countScenes(this.tree()));
  readonly totalCount = computed(() => countScenes(this.store.tree()));

  /** Alphabetical. */
  readonly tags = computed(() => {
    const byId = new Map<string, Tag>();
    for (const info of this.links().values()) {
      for (const tag of info.tags) byId.set(tag.id, tag);
    }
    return [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  });

  readonly linkedNoteIds = computed(() => {
    const ids = new Set<string>();
    for (const info of this.links().values()) info.noteIds.forEach((id) => ids.add(id));
    return ids;
  });

  async load(): Promise<void> {
    const [relations, strands] = await Promise.all([
      this.api.sceneRelations(),
      this.api.listStrands(),
    ]);
    this.links.set(
      new Map(
        relations.map((r) => [
          r.sceneId,
          { noteIds: new Set(r.noteIds), tags: r.tags, strandIds: r.strandIds },
        ]),
      ),
    );
    this.strands.set(strands.filter((strand) => strand.sceneCount > 0));
    // Stop filtering by deleted threads (no scene would match any more)
    const known = new Set(strands.map((strand) => strand.id));
    this.criteria.update((criteria) => ({
      ...criteria,
      strandIds: criteria.strandIds.filter((id) => known.has(id)),
    }));
  }

  /** After changes in a scene (thread assigned, character linked, tag added …). */
  updateScene(
    sceneId: string,
    info: { noteIds: readonly string[]; tags: readonly Tag[]; strandIds: readonly string[] },
  ): void {
    this.links.update((links) =>
      new Map(links).set(sceneId, {
        noteIds: new Set(info.noteIds),
        tags: [...info.tags],
        strandIds: [...info.strandIds],
      }),
    );
  }

  isSelected(group: FilterGroup, value: string): boolean {
    return (this.criteria()[group] as readonly string[]).includes(value);
  }

  toggle(group: FilterGroup, value: string): void {
    this.criteria.update((criteria) => {
      const current = criteria[group] as readonly string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...criteria, [group]: next };
    });
  }

  reset(): void {
    this.criteria.set(NO_FILTER);
  }
}

function activeCount(criteria: SceneFilterCriteria): number {
  return Object.values(criteria).reduce((sum, values) => sum + values.length, 0);
}

/**
 * @param noteKindOf kind of a note (character, place …); unknown (deleted) notes are ignored by the
 * filter.
 */
export function matchesScene(
  node: ManuscriptNode,
  criteria: SceneFilterCriteria,
  links: SceneLinksInfo | undefined,
  noteKindOf: (noteId: string) => string | undefined,
): boolean {
  if (criteria.statuses.length && !criteria.statuses.includes(node.status ?? 'idea')) {
    return false;
  }
  const annotations = node.annotations ?? NO_ANNOTATIONS;
  if (criteria.annotations.length && !criteria.annotations.some((kind) => annotations[kind] > 0)) {
    return false;
  }
  if (criteria.flags.includes('turningPoint') && !node.turningPoint) {
    return false;
  }
  if (
    criteria.strandIds.length &&
    !links?.strandIds.some((id) => criteria.strandIds.includes(id))
  ) {
    return false;
  }
  if (criteria.tagIds.length && !links?.tags.some((tag) => criteria.tagIds.includes(tag.id))) {
    return false;
  }
  // Characters and places are groups of their own: per kind, one of the chosen notes must appear.
  const notesByKind = new Map<string, string[]>();
  for (const id of criteria.noteIds) {
    const kind = noteKindOf(id);
    if (kind) notesByKind.set(kind, [...(notesByKind.get(kind) ?? []), id]);
  }
  for (const ids of notesByKind.values()) {
    if (!ids.some((id) => links?.noteIds.has(id))) return false;
  }
  return true;
}

/**
 * Chapters and parts without hits drop out. Word counts and marks are summed again for what is
 * visible.
 */
export function filterTree(
  items: readonly TreeItem[],
  matches: (node: ManuscriptNode) => boolean,
): TreeItem[] {
  return items.flatMap((item): TreeItem[] => {
    if (item.node.kind === 'scene') return matches(item.node) ? [item] : [];
    const children = filterTree(item.children, matches);
    if (!children.length) return [];
    return [
      {
        ...item,
        children,
        annotations: children.reduce(
          (sum, child) => addCounts(sum, child.annotations),
          NO_ANNOTATIONS,
        ),
        wordCount: children.reduce((sum, child) => sum + child.wordCount, 0),
      },
    ];
  });
}

export function countScenes(items: readonly TreeItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.node.kind === 'scene' ? 1 : countScenes(item.children)),
    0,
  );
}
