import type { ArcStep, ManuscriptNode } from '@wortomat/shared';
import type { TreeItem } from '../../core/project-store';
import { storyColumns } from '../plot/story-order';

/**
 * A station whose (first) scene happens earlier or later in the story than its place in the arc says. By
 * story order it belongs after `afterId` and before `beforeId` (`null` = no such neighbour).
 */
export interface ArcOrderIssue {
  afterId: string | null;
  beforeId: string | null;
}

/**
 * Scene → position in the story order of the plot view (without any arranging that is the book
 * order). Simultaneous scenes share a position.
 */
export function storyPositions(tree: readonly TreeItem[]): Map<string, number> {
  const scenes: ManuscriptNode[] = [];
  const visit = (items: readonly TreeItem[]) => {
    for (const { node, children } of items) {
      if (node.kind === 'scene') scenes.push(node);
      else visit(children);
    }
  };
  visit(tree);
  const positions = new Map<string, number>();
  storyColumns(scenes).forEach((column, index) => {
    for (const id of column.sceneIds) positions.set(id, index);
  });
  return positions;
}

/**
 * As few stations as possible are flagged: all except the longest run whose scenes already follow
 * the story order (like the displaced scenes in the plot view). Stations without a scene never
 * count, simultaneous scenes are in order either way.
 */
export function arcOrderIssues(
  steps: readonly ArcStep[],
  positions: ReadonlyMap<string, number>,
): Map<string, ArcOrderIssue> {
  const placed = steps.flatMap((step) => {
    const position = firstPosition(step, positions);
    return position === undefined ? [] : [{ id: step.id, position }];
  });

  // Longest non-decreasing subsequence (patience sorting)
  const tails: number[] = [];
  const previous = new Array<number>(placed.length).fill(-1);
  placed.forEach(({ position }, i) => {
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (placed[tails[middle]!]!.position <= position) low = middle + 1;
      else high = middle;
    }
    if (low > 0) previous[i] = tails[low - 1]!;
    tails[low] = i;
  });
  const inOrder: typeof placed = [];
  for (let i = tails.at(-1) ?? -1; i >= 0; i = previous[i]!) inOrder.unshift(placed[i]!);
  const inOrderIds = new Set(inOrder.map((step) => step.id));

  const issues = new Map<string, ArcOrderIssue>();
  for (const step of placed) {
    if (inOrderIds.has(step.id)) continue;
    const before = inOrder.find((other) => other.position > step.position);
    const after = inOrder.filter((other) => other.position <= step.position).at(-1);
    issues.set(step.id, { afterId: after?.id ?? null, beforeId: before?.id ?? null });
  }
  return issues;
}

/**
 * Station IDs sorted by the story order of their scenes. Stations without a scene keep their place;
 * on equal positions the current order stays.
 */
export function sortedByStory(
  steps: readonly ArcStep[],
  positions: ReadonlyMap<string, number>,
): string[] {
  const position = (step: ArcStep) => firstPosition(step, positions);
  const slots = steps.flatMap((step, index) => (position(step) === undefined ? [] : [index]));
  const sorted = slots.map((index) => steps[index]!).sort((a, b) => position(a)! - position(b)!);
  const result = steps.map((step) => step.id);
  slots.forEach((slot, i) => (result[slot] = sorted[i]!.id));
  return result;
}

/**
 * Where the station first shows in the story – a change that spreads over several scenes starts
 * with the earliest one. `undefined` without any (existing) scene.
 */
function firstPosition(step: ArcStep, positions: ReadonlyMap<string, number>): number | undefined {
  const found = step.sceneIds.flatMap((id) => positions.get(id) ?? []);
  return found.length ? Math.min(...found) : undefined;
}
