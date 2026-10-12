import { computed, inject, Injectable, signal } from '@angular/core';
import type { AnnotationKind, ManuscriptNode, SceneStatus, Tag } from '@wortomat/shared';
import { addCounts, NO_ANNOTATIONS } from '../../core/annotations';
import { ProjectStore, type TreeItem } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';

/**
 * Wonach gefiltert wird. Innerhalb einer Gruppe reicht eins („Anna oder Ben“),
 * zwischen den Gruppen muss alles passen („Anna und Status Entwurf“).
 */
export interface SceneFilterCriteria {
  statuses: readonly SceneStatus[];
  /** Szenen mit offenen Todos/Ideen/Fixmes dieser Arten. */
  annotations: readonly AnnotationKind[];
  /** Charaktere und Orte (eine Gruppe je Art, s. `noteKinds`). */
  noteIds: readonly string[];
  tagIds: readonly string[];
}

export type FilterGroup = keyof SceneFilterCriteria;

export const NO_FILTER: SceneFilterCriteria = {
  statuses: [],
  annotations: [],
  noteIds: [],
  tagIds: [],
};

/** Was einer Szene zugeordnet ist. */
export interface SceneLinksInfo {
  noteIds: ReadonlySet<string>;
  tags: readonly Tag[];
}

/**
 * Filter für die Szenen im Manuskript-Baum. Wird im Arbeitsbereich bereitgestellt:
 * bleibt beim Wechsel zwischen den Bereichen erhalten und gilt nur für das geöffnete Projekt.
 */
@Injectable()
export class SceneFilter {
  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly notes = inject(NotesStore);

  readonly criteria = signal<SceneFilterCriteria>(NO_FILTER);
  /** Charaktere, Orte und Tags je Szene; wird beim Öffnen des Filters frisch geladen. */
  readonly links = signal<ReadonlyMap<string, SceneLinksInfo>>(new Map());

  readonly active = computed(() => activeCount(this.criteria()) > 0);
  readonly activeCount = computed(() => activeCount(this.criteria()));

  /** Der Manuskript-Baum, wie er angezeigt wird – bei aktivem Filter nur mit passenden Szenen. */
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

  /** Alle vergebenen Tags, alphabetisch. */
  readonly tags = computed(() => {
    const byId = new Map<string, Tag>();
    for (const info of this.links().values()) {
      for (const tag of info.tags) byId.set(tag.id, tag);
    }
    return [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  });

  /** Notizen, die in mindestens einer Szene vorkommen. */
  readonly linkedNoteIds = computed(() => {
    const ids = new Set<string>();
    for (const info of this.links().values()) info.noteIds.forEach((id) => ids.add(id));
    return ids;
  });

  async load(): Promise<void> {
    const relations = await this.api.sceneRelations();
    this.links.set(
      new Map(relations.map((r) => [r.sceneId, { noteIds: new Set(r.noteIds), tags: r.tags }])),
    );
  }

  /** Nach Änderungen in einer Szene (Charakter verknüpft, Tag vergeben …). */
  updateScene(sceneId: string, noteIds: readonly string[], tags: readonly Tag[]): void {
    this.links.update((links) =>
      new Map(links).set(sceneId, { noteIds: new Set(noteIds), tags: [...tags] }),
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
 * Passt die Szene zum Filter?
 * @param noteKindOf Art einer Notiz (Charakter, Ort …); unbekannte (gelöschte) Notizen
 *   werden im Filter ignoriert.
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
  if (criteria.tagIds.length && !links?.tags.some((tag) => criteria.tagIds.includes(tag.id))) {
    return false;
  }
  // Charaktere und Orte sind eigene Gruppen: je Art muss eine der gewählten Notizen vorkommen.
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
 * Baum nur mit passenden Szenen; Kapitel und Teile ohne Treffer fallen weg.
 * Wortzahlen und Markierungen werden für das Sichtbare neu summiert.
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

/** Anzahl der Szenen im (ggf. gefilterten) Baum. */
export function countScenes(items: readonly TreeItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.node.kind === 'scene' ? 1 : countScenes(item.children)),
    0,
  );
}
