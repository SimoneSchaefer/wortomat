import type { StoryMark } from '@wortomat/shared';

/** Scenes that happen at the same time. */
export interface StoryColumn {
  sceneIds: string[];
  /** `null` for scenes that were never placed. */
  value: number | null;
}

/**
 * Placed scenes go by their position (same position = one column). Never placed scenes – all of
 * them until something was arranged, later only new ones – follow right after the scene before them
 * in the book.
 */
export function storyColumns(
  scenes: ReadonlyArray<{ id: string; storyOrder: number | null }>,
): StoryColumn[] {
  const placed = new Map<number, string[]>();
  /** Never placed scenes per column they follow (`null` = at the very front). */
  const following = new Map<number | null, string[]>();
  let anchor: number | null = null;
  for (const scene of scenes) {
    if (scene.storyOrder === null) {
      following.set(anchor, [...(following.get(anchor) ?? []), scene.id]);
    } else {
      anchor = scene.storyOrder;
      placed.set(anchor, [...(placed.get(anchor) ?? []), scene.id]);
    }
  }
  const loose = (key: number | null): StoryColumn[] =>
    (following.get(key) ?? []).map((id) => ({ sceneIds: [id], value: null }));
  const columns = loose(null);
  for (const value of [...placed.keys()].sort((a, b) => a - b)) {
    columns.push({ sceneIds: placed.get(value)!, value }, ...loose(value));
  }
  return columns;
}

export type DropTarget =
  /** into the same column as this scene: simultaneous */
  | { join: string }
  /** as a column of its own before the column with this scene; `null` = at the end */
  | { before: string | null };

/** Empty columns drop out. */
export function moveScene(
  columns: readonly (readonly string[])[],
  sceneId: string,
  target: DropTarget,
): string[][] {
  const result = columns
    .map((column) => column.filter((id) => id !== sceneId))
    .filter((column) => column.length > 0);
  if ('join' in target) {
    const column = result.find((ids) => ids.includes(target.join));
    if (column) column.push(sceneId);
    else result.push([sceneId]);
    return result;
  }
  const index =
    target.before === null ? -1 : result.findIndex((ids) => ids.includes(target.before!));
  result.splice(index < 0 ? result.length : index, 0, [sceneId]);
  return result;
}

/**
 * Scenes placed differently in the book than in the story (flashbacks, flash-forwards …): all
 * except the longest sequence whose order matches in both – so as few as possible. Simultaneous
 * scenes count in book order.
 */
export function displacedScenes(
  columns: readonly (readonly string[])[],
  bookIndex: ReadonlyMap<string, number>,
): Set<string> {
  const sequence = columns.flatMap((ids) =>
    [...ids].sort((a, b) => bookIndex.get(a)! - bookIndex.get(b)!),
  );
  // Longest increasing subsequence (patience sorting) over the book positions
  const tails: number[] = []; // index in `sequence` of the smallest end per length
  const previous = new Array<number>(sequence.length).fill(-1);
  sequence.forEach((id, i) => {
    const value = bookIndex.get(id)!;
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (bookIndex.get(sequence[tails[middle]!]!)! < value) low = middle + 1;
      else high = middle;
    }
    if (low > 0) previous[i] = tails[low - 1]!;
    tails[low] = i;
  });
  const inOrder = new Set<string>();
  for (let i = tails.at(-1) ?? -1; i >= 0; i = previous[i]!) inOrder.add(sequence[i]!);
  return new Set(sequence.filter((id) => !inOrder.has(id)));
}

/**
 * Before the first placed column whose position is at least the mark's. Marks without such a column
 * drop out.
 */
export function marksByColumn(
  columns: readonly StoryColumn[],
  marks: readonly StoryMark[],
): Map<number, StoryMark> {
  const result = new Map<number, StoryMark>();
  const pending = [...marks].sort((a, b) => a.position - b.position);
  columns.forEach((column, index) => {
    if (column.value === null) return;
    while (pending.length && pending[0]!.position <= column.value) {
      result.set(index, pending.shift()!);
    }
  });
  return result;
}

/**
 * Still before the same column – or, if the moved scene stood alone there, before the column that
 * came after it.
 */
export function remapMark(
  before: readonly (readonly string[])[],
  after: readonly (readonly string[])[],
  beforeColumn: number,
  movedId: string,
): number {
  for (let i = beforeColumn; i < before.length; i++) {
    const anchor = before[i]!.find((id) => id !== movedId);
    if (anchor) return after.findIndex((ids) => ids.includes(anchor));
  }
  return after.length - 1;
}
