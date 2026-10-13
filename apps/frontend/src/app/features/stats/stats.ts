import type { ManuscriptNode, NoteSummary, SceneRelations, SceneStatus } from '@wortomat/shared';
import type { TreeItem } from '../../core/project-store';
import { SCENE_STATUSES } from '../../core/scene-status';

/** Faustregel für eine Normseite (1.800 Zeichen). */
export const WORDS_PER_PAGE = 250;

export type StatusTally = Record<SceneStatus, number>;

/** Eine Szene in Lesereihenfolge, mit ihrem Kapitel. */
export interface SceneEntry {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  /** Laufende Nummer des Kapitels im Buch, ab 1. */
  chapterNumber: number;
}

export interface ChapterStats {
  chapter: ManuscriptNode;
  number: number;
  /** Titel des Teils, wenn das Kapitel in einem liegt. */
  part: string | null;
  words: number;
  scenes: number;
  /** Wörter je Status – für den gestapelten Balken. */
  wordsByStatus: StatusTally;
}

export interface StatusTotal {
  status: SceneStatus;
  words: number;
  scenes: number;
}

export interface PresenceRow {
  note: NoteSummary;
  /** Index der Szene (in `SceneEntry[]`) → kommt vor. */
  appearances: ReadonlySet<number>;
  /** Summe der Wörter aller Szenen mit dieser Figur. */
  words: number;
}

export interface Presence {
  /** Nach erstem Auftritt sortiert. */
  rows: PresenceRow[];
  /** Mit keiner Szene verknüpft. */
  absent: NoteSummary[];
}

export function emptyTally(): StatusTally {
  return { idea: 0, outline: 0, draft: 0, revised: 0, final: 0 };
}

/** Alle Szenen in Lesereihenfolge; Kapitel werden über Teile hinweg durchgezählt. */
export function scenesInOrder(tree: readonly TreeItem[]): SceneEntry[] {
  const entries: SceneEntry[] = [];
  let chapterNumber = 0;
  const visit = (items: readonly TreeItem[]) => {
    for (const item of items) {
      if (item.node.kind === 'part') visit(item.children);
      if (item.node.kind !== 'chapter') continue;
      chapterNumber++;
      for (const child of item.children) {
        if (child.node.kind === 'scene') {
          entries.push({ scene: child.node, chapter: item.node, chapterNumber });
        }
      }
    }
  };
  visit(tree);
  return entries;
}

export function chapterStats(tree: readonly TreeItem[]): ChapterStats[] {
  const chapters: ChapterStats[] = [];
  const visit = (items: readonly TreeItem[], part: string | null) => {
    for (const item of items) {
      if (item.node.kind === 'part') visit(item.children, item.node.title);
      if (item.node.kind !== 'chapter') continue;
      const wordsByStatus = emptyTally();
      let scenes = 0;
      for (const child of item.children) {
        if (child.node.kind !== 'scene') continue;
        scenes++;
        wordsByStatus[child.node.status ?? 'idea'] += child.node.wordCount;
      }
      chapters.push({
        chapter: item.node,
        number: chapters.length + 1,
        part,
        words: item.wordCount,
        scenes,
        wordsByStatus,
      });
    }
  };
  visit(tree, null);
  return chapters;
}

/** Wörter und Szenen je Status, in Arbeitsreihenfolge (Idee → Fertig). */
export function statusTotals(scenes: readonly SceneEntry[]): StatusTotal[] {
  const totals = SCENE_STATUSES.map(({ status }) => ({ status, words: 0, scenes: 0 }));
  for (const { scene } of scenes) {
    const total = totals.find((entry) => entry.status === (scene.status ?? 'idea'))!;
    total.words += scene.wordCount;
    total.scenes++;
  }
  return totals;
}

/** Wer kommt wo vor: eine Zeile je Notiz, sortiert nach erstem Auftritt. */
export function presence(
  scenes: readonly SceneEntry[],
  notes: readonly NoteSummary[],
  relations: readonly SceneRelations[],
): Presence {
  const linked = new Map(relations.map((entry) => [entry.sceneId, new Set(entry.noteIds)]));
  const rows: PresenceRow[] = [];
  const absent: NoteSummary[] = [];
  for (const note of notes) {
    const appearances = new Set<number>();
    let words = 0;
    scenes.forEach(({ scene }, index) => {
      if (linked.get(scene.id)?.has(note.id)) {
        appearances.add(index);
        words += scene.wordCount;
      }
    });
    if (appearances.size) rows.push({ note, appearances, words });
    else absent.push(note);
  }
  const first = (row: PresenceRow) => Math.min(...row.appearances);
  rows.sort(
    (a, b) =>
      first(a) - first(b) ||
      b.appearances.size - a.appearances.size ||
      a.note.title.localeCompare(b.note.title),
  );
  absent.sort((a, b) => a.title.localeCompare(b.title));
  return { rows, absent };
}
