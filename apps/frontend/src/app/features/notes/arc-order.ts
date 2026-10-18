import type { ArcStep, ManuscriptNode } from '@wortomat/shared';
import type { TreeItem } from '../../core/project-store';
import { storyColumns } from '../plot/story-order';

/** A scene of a flagged station that clashes with the stations in order. */
export interface SceneClash {
  sceneId: string;
  /** It happens before (some scene of) / after (the start of) the station `stationId`. */
  relation: 'before' | 'after';
  stationId: string;
}

/**
 * A station whose scenes do not fit between the stations around it in the story.
 */
export interface ArcOrderIssue {
  /**
   * Where the whole station would fit: after `afterId` and before `beforeId` (`null` = no such
   * neighbour). `null` when no place fits – its scenes reach past other stations.
   */
  slot: { afterId: string | null; beforeId: string | null } | null;
  /** Its scenes that are out of place; at least one. */
  clashes: SceneClash[];
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

interface Span {
  id: string;
  /** Story positions of its earliest and latest scene. */
  first: number;
  last: number;
  scenes: Array<{ id: string; position: number }>;
}

/**
 * In order means: every scene of a station happens no earlier than every scene of the stations
 * before it. Simultaneous scenes – or a scene two stations share – are fine.
 *
 * As few stations as possible are flagged: all except the longest run that is in order (like the
 * displaced scenes in the plot view). Stations without a scene never count.
 */
export function arcOrderIssues(
  steps: readonly ArcStep[],
  positions: ReadonlyMap<string, number>,
): Map<string, ArcOrderIssue> {
  const spans = steps.flatMap((step): Span[] => {
    const scenes = step.sceneIds.flatMap((id) => {
      const position = positions.get(id);
      return position === undefined ? [] : [{ id, position }];
    });
    if (!scenes.length) return [];
    const all = scenes.map((scene) => scene.position);
    return [{ id: step.id, first: Math.min(...all), last: Math.max(...all), scenes }];
  });

  // Longest chain in which each station starts no earlier than the one before ends. On a tie the
  // narrower stations stay – a stray scene is likelier in one that spans much of the story – and
  // then the later ones, so the station that moved is flagged rather than the one it jumped over.
  const width = (span: Span) => span.last - span.first;
  const length = spans.map(() => 1);
  const spread = spans.map(width);
  const previous = spans.map(() => -1);
  const better = (len: number, wide: number, i: number) =>
    len > length[i]! || (len === length[i]! && wide <= spread[i]!);
  spans.forEach((span, i) => {
    for (let j = 0; j < i; j++) {
      if (spans[j]!.last > span.first) continue;
      if (better(length[j]! + 1, spread[j]! + width(span), i)) {
        length[i] = length[j]! + 1;
        spread[i] = spread[j]! + width(span);
        previous[i] = j;
      }
    }
  });
  let end = -1;
  length.forEach((len, i) => {
    if (end < 0 || len > length[end]! || (len === length[end]! && spread[i]! <= spread[end]!)) {
      end = i;
    }
  });
  const kept: Span[] = [];
  for (let i = end; i >= 0; i = previous[i]!) kept.unshift(spans[i]!);
  const keptIds = new Set(kept.map((span) => span.id));
  const order = new Map(steps.map((step, index) => [step.id, index]));

  const issues = new Map<string, ArcOrderIssue>();
  for (const span of spans) {
    if (keptIds.has(span.id)) continue;
    issues.set(span.id, { slot: slotFor(span, kept), clashes: clashesOf(span, kept, order) });
  }
  return issues;
}

/** The last gap in the run the whole station fits into – after simultaneous ones, as in a list. */
function slotFor(span: Span, kept: readonly Span[]): ArcOrderIssue['slot'] {
  for (let t = kept.length; t >= 0; t--) {
    const before = kept[t - 1];
    const after = kept[t];
    if ((!before || before.last <= span.first) && (!after || span.last <= after.first)) {
      return { afterId: before?.id ?? null, beforeId: after?.id ?? null };
    }
  }
  return null;
}

/** Measured against the stations in order around it in the list. */
function clashesOf(
  span: Span,
  kept: readonly Span[],
  order: ReadonlyMap<string, number>,
): SceneClash[] {
  const index = order.get(span.id)!;
  const earlier = kept.filter((other) => order.get(other.id)! < index);
  const later = kept.filter((other) => order.get(other.id)! > index);
  return span.scenes.flatMap(({ id, position }): SceneClash[] => {
    const overtaken = earlier.find((other) => other.last > position);
    if (overtaken) return [{ sceneId: id, relation: 'before', stationId: overtaken.id }];
    const passed = later.filter((other) => other.first < position).at(-1);
    if (passed) return [{ sceneId: id, relation: 'after', stationId: passed.id }];
    return [];
  });
}

/**
 * Station IDs sorted by the story order of their scenes (earliest first, then latest). Stations
 * without a scene keep their place; on equal positions the current order stays. Stations whose
 * scenes overlap stay flagged – no order fixes that.
 */
export function sortedByStory(
  steps: readonly ArcStep[],
  positions: ReadonlyMap<string, number>,
): string[] {
  const range = (step: ArcStep) => {
    const found = step.sceneIds.flatMap((id) => positions.get(id) ?? []);
    return found.length ? [Math.min(...found), Math.max(...found)] : undefined;
  };
  const slots = steps.flatMap((step, index) => (range(step) === undefined ? [] : [index]));
  const sorted = slots
    .map((index) => steps[index]!)
    .sort((a, b) => range(a)![0]! - range(b)![0]! || range(a)![1]! - range(b)![1]!);
  const result = steps.map((step) => step.id);
  slots.forEach((slot, i) => (result[slot] = sorted[i]!.id));
  return result;
}
