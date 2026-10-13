import type { StoryMark } from '@wortomat/shared';

/** Eine Spalte der Handlung: Szenen, die gleichzeitig passieren. */
export interface StoryColumn {
  sceneIds: string[];
  /** Gespeicherte Position; `null` bei Szenen, die noch nie platziert wurden. */
  value: number | null;
}

/**
 * Reihenfolge der Handlung aus den Szenen in Buchreihenfolge. Platzierte Szenen stehen nach
 * ihrer Position (gleiche Position = eine Spalte). Nie platzierte Szenen – alle, solange man
 * nichts geordnet hat, später nur neue – folgen direkt der Szene, die im Buch davor steht.
 */
export function storyColumns(
  scenes: ReadonlyArray<{ id: string; storyOrder: number | null }>,
): StoryColumn[] {
  const placed = new Map<number, string[]>();
  /** Nie platzierte Szenen je Spalte, hinter der sie stehen (`null` = ganz vorn). */
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

/** Wohin eine Szene gezogen wird. */
export type DropTarget =
  /** in dieselbe Spalte wie diese Szene: gleichzeitig */
  | { join: string }
  /** als eigene Spalte vor die Spalte mit dieser Szene; `null` = ans Ende */
  | { before: string | null };

/** Verschiebt eine Szene; leere Spalten fallen weg. */
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
 * Szenen, die im Buch an anderer Stelle stehen als in der Handlung (Rückblenden, Vorgriffe …):
 * alle außer der längsten Folge, deren Reihenfolge in beiden übereinstimmt – also so wenige
 * wie möglich. Gleichzeitige Szenen zählen in Buchreihenfolge.
 */
export function displacedScenes(
  columns: readonly (readonly string[])[],
  bookIndex: ReadonlyMap<string, number>,
): Set<string> {
  const sequence = columns.flatMap((ids) =>
    [...ids].sort((a, b) => bookIndex.get(a)! - bookIndex.get(b)!),
  );
  // Längste aufsteigende Teilfolge (Patience Sorting) über die Buchpositionen
  const tails: number[] = []; // Index in `sequence` des kleinsten Endes je Länge
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
 * Welche Marke vor welcher Spalte beginnt: vor der ersten platzierten Spalte, deren Position
 * mindestens so groß ist wie die der Marke. Marken ohne solche Spalte fallen weg.
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
 * Wo eine Marke nach dem Verschieben einer Szene steht: weiter vor derselben Spalte – oder,
 * wenn die verschobene Szene allein dort stand, vor der Spalte, die danach kam.
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
