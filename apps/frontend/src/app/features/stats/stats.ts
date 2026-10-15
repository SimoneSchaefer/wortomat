import type { ManuscriptNode, NoteSummary, SceneRelations, SceneStatus } from '@wortomat/shared';
import type { TreeItem } from '../../core/project-store';
import { SCENE_STATUSES } from '../../core/scene-status';
import type { SceneTextStats } from '../../core/text-analysis';

/** Rule of thumb for a standard page (1,800 characters). */
export const WORDS_PER_PAGE = 250;

export type StatusTally = Record<SceneStatus, number>;

export interface SceneEntry {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  /** Running number of the chapter in the book, from 1. */
  chapterNumber: number;
}

export interface ChapterStats {
  chapter: ManuscriptNode;
  number: number;
  part: string | null;
  words: number;
  scenes: number;
  /** For the stacked bar. */
  wordsByStatus: StatusTally;
}

export interface StatusTotal {
  status: SceneStatus;
  words: number;
  scenes: number;
}

export interface PresenceRow {
  note: NoteSummary;
  /** Scene indices (in `SceneEntry[]`) it appears in. */
  appearances: ReadonlySet<number>;
  /** Sum of the words of all scenes with this character. */
  words: number;
}

export interface Presence {
  /** Sorted by first appearance. */
  rows: PresenceRow[];
  /** Linked to no scene. */
  absent: NoteSummary[];
}

export function emptyTally(): StatusTally {
  return { idea: 0, outline: 0, draft: 0, revised: 0, final: 0 };
}

/** Chapters are numbered across parts. */
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

/** In working order (idea → final). */
export function statusTotals(scenes: readonly SceneEntry[]): StatusTotal[] {
  const totals = SCENE_STATUSES.map(({ status }) => ({ status, words: 0, scenes: 0 }));
  for (const { scene } of scenes) {
    const total = totals.find((entry) => entry.status === (scene.status ?? 'idea'))!;
    total.words += scene.wordCount;
    total.scenes++;
  }
  return totals;
}

/** One row per note, sorted by first appearance. */
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

export interface ChapterText {
  chapter: ManuscriptNode;
  number: number;
  words: number;
  dialogueWords: number;
  sentences: number;
}

/** Summed per chapter, in reading order (empty chapters too). */
export function chapterText(
  tree: readonly TreeItem[],
  scenes: readonly SceneTextStats[],
): ChapterText[] {
  const bySceneId = new Map(scenes.map((entry) => [entry.sceneId, entry]));
  const entries = scenesInOrder(tree);
  return chapterStats(tree).map(({ chapter, number }) => {
    const result: ChapterText = { chapter, number, words: 0, dialogueWords: 0, sentences: 0 };
    for (const entry of entries) {
      if (entry.chapter.id !== chapter.id) continue;
      const stats = bySceneId.get(entry.scene.id);
      if (!stats) continue;
      result.words += stats.words;
      result.dialogueWords += stats.dialogueWords;
      result.sentences += stats.sentences;
    }
    return result;
  });
}
