import type { ManuscriptNode, Strand } from '@wortomat/shared';

/** In pixels. */
export interface PlotGeometry {
  columnWidth: number;
  /** Distance between the threads (lanes). */
  laneHeight: number;
  /** How far the title reaches below a node; 0 = no title. */
  labelReach: number;
}

export const PLOT_GEOMETRY = {
  /** Wide enough for two lines of scene title below each node. */
  regular: { columnWidth: 120, laneHeight: 88, labelReach: 40 },
  /** Without titles – for long books. */
  compact: { columnWidth: 44, laneHeight: 56, labelReach: 0 },
} satisfies Record<string, PlotGeometry>;

/** Extra gap between two groups (chapters or story sections). */
export const GROUP_GAP = 18;
export const NODE_SIZE = 20;
/** Spacing of the lines that run bundled into a shared scene. */
export const BUNDLE_GAP = 7;
/** Distance over which a line bends between its lane and a shared scene. */
const BEND = 40;

export interface PlotScene {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  /** Running number of the chapter in the book (from 1). */
  chapterNumber: number;
  /** Position in the book (from 1). */
  bookNumber: number;
  strandIds: readonly string[];
}

/** Chapter (book order) or story section, e.g. "Day 1". */
export interface PlotGroupInfo {
  id: string;
  /** Empty for the section before the first mark. */
  label: string;
  /** `null` for sections. */
  number: number | null;
}

/** Input: scenes that happen at the same time (in book order: always just one). */
export interface PlotColumnInput {
  scenes: readonly PlotScene[];
  group: PlotGroupInfo;
}

/** A thread, or the collecting row for scenes without a thread. */
export interface PlotLane {
  /** `null` = "No thread" */
  strand: Strand | null;
  y: number;
  nodeCount: number;
}

export interface PlotNode extends PlotScene {
  /** In row order. */
  strands: Strand[];
  column: number;
  x: number;
  /** Centre of the node. */
  y: number;
  /** With several threads an elongated oval, otherwise a circle. */
  height: number;
}

/** E.g. to find the spot under the mouse pointer while dragging. */
export interface PlotColumn {
  left: number;
  width: number;
  sceneIds: string[];
}

export interface PlotLine {
  strand: Strand;
  /** SVG path (`d`). */
  path: string;
}

export interface PlotGroup extends PlotGroupInfo {
  /** Left edge and width of the area. */
  x: number;
  width: number;
  firstColumn: number;
}

export interface PlotLayout {
  width: number;
  height: number;
  lanes: PlotLane[];
  nodes: PlotNode[];
  columns: PlotColumn[];
  lines: PlotLine[];
  groups: PlotGroup[];
}

/**
 * Arranges the columns from left to right and the threads as rows. A scene in several threads sits
 * centred between their rows; the lines bend there, run in bundled and return to their row
 * afterwards. Simultaneous scenes are stacked; if they (with their titles) would get in each
 * other's way, the column gets side-by-side slots.
 */
export function layoutPlot(
  input: readonly PlotColumnInput[],
  strands: readonly Strand[],
  geometry: PlotGeometry = PLOT_GEOMETRY.regular,
): PlotLayout {
  const { columnWidth, laneHeight, labelReach } = geometry;
  const laneIndex = new Map(strands.map((strand, index) => [strand.id, index]));
  const strandsOf = (entry: PlotScene) =>
    entry.strandIds
      .filter((id) => laneIndex.has(id))
      .sort((a, b) => laneIndex.get(a)! - laneIndex.get(b)!)
      .map((id) => strands[laneIndex.get(id)!]!);

  const laneY = (index: number) => index * laneHeight + laneHeight / 2;
  const lanes: PlotLane[] = strands.map((strand, index) => ({
    strand,
    y: laneY(index),
    nodeCount: 0,
  }));
  const unassigned = input.some((column) =>
    column.scenes.some((entry) => strandsOf(entry).length === 0),
  );
  if (unassigned) lanes.push({ strand: null, y: laneY(strands.length), nodeCount: 0 });

  const nodes: PlotNode[] = [];
  const columns: PlotColumn[] = [];
  const groups: PlotGroup[] = [];
  /** Where each line enters its nodes, per thread from left to right. */
  const anchors = new Map<string, Array<{ x: number; y: number }>>();
  let left = 0;
  input.forEach((column, columnIndex) => {
    let group = groups.at(-1);
    if (group?.id !== column.group.id) {
      if (group) left += GROUP_GAP;
      group = { ...column.group, x: left, width: 0, firstColumn: columnIndex };
      groups.push(group);
    }

    // First each node's height, then spread them side by side where needed
    const placed = column.scenes.map((entry) => {
      const nodeStrands = strandsOf(entry);
      const rows = nodeStrands.length
        ? nodeStrands.map((strand) => laneIndex.get(strand.id)!)
        : [strands.length];
      const y = rows.reduce((sum, row) => sum + laneY(row), 0) / rows.length;
      const height = NODE_SIZE + Math.max(0, nodeStrands.length - 1) * BUNDLE_GAP;
      for (const row of rows) lanes[row]!.nodeCount++;
      return { entry, nodeStrands, y, height, slot: 0 };
    });
    const slots: Array<Array<{ top: number; bottom: number }>> = [];
    for (const node of [...placed].sort((a, b) => a.y - b.y)) {
      const top = node.y - node.height / 2;
      // Nodes need some air between them even without titles
      const bottom = node.y + node.height / 2 + Math.max(labelReach, BUNDLE_GAP);
      let slot = slots.findIndex((taken) =>
        taken.every((other) => bottom <= other.top || top >= other.bottom),
      );
      if (slot < 0) slot = slots.push([]) - 1;
      slots[slot]!.push({ top, bottom });
      node.slot = slot;
    }
    const width = Math.max(1, slots.length) * columnWidth;
    columns.push({ left, width, sceneIds: column.scenes.map((entry) => entry.scene.id) });

    for (const node of placed) {
      const x = left + node.slot * columnWidth + columnWidth / 2;
      node.nodeStrands.forEach((strand, index) => {
        const offset = (index - (node.nodeStrands.length - 1) / 2) * BUNDLE_GAP;
        const points = anchors.get(strand.id) ?? [];
        points.push({ x, y: node.y + offset });
        anchors.set(strand.id, points);
      });
      nodes.push({
        ...node.entry,
        strands: node.nodeStrands,
        column: columnIndex,
        x,
        y: node.y,
        height: node.height,
      });
    }
    left += width;
    group.width = left - group.x;
  });

  const lines = strands.flatMap((strand): PlotLine[] => {
    const points = (anchors.get(strand.id) ?? []).sort((a, b) => a.x - b.x);
    if (points.length < 2) return [];
    return [{ strand, path: linePath(points, laneY(laneIndex.get(strand.id)!)) }];
  });

  return {
    width: left,
    height: laneY(lanes.length) - laneHeight / 2,
    lanes,
    nodes,
    columns,
    lines,
    groups,
  };
}

/**
 * Between two nodes it runs on its row `laneY` and only bends shortly before or after a shared
 * scene.
 */
export function linePath(points: ReadonlyArray<{ x: number; y: number }>, laneY: number): string {
  const [first, ...rest] = points;
  if (!first) return '';
  const parts = [`M${first.x} ${first.y}`];
  let a = first;
  for (const b of rest) {
    const distance = b.x - a.x;
    if (a.y === laneY && b.y === laneY) {
      parts.push(`H${b.x}`);
    } else if (distance <= 2 * BEND) {
      const middle = a.x + distance / 2;
      parts.push(`C${middle} ${a.y} ${middle} ${b.y} ${b.x} ${b.y}`);
    } else {
      if (a.y !== laneY) parts.push(curve(a.x, a.y, a.x + BEND, laneY));
      parts.push(`H${b.x - (b.y === laneY ? 0 : BEND)}`);
      if (b.y !== laneY) parts.push(curve(b.x - BEND, laneY, b.x, b.y));
    }
    a = b;
  }
  return parts.join(' ');
}

/** Soft S-curve from (x1, y1) to (x2, y2) with horizontal ends. */
function curve(x1: number, y1: number, x2: number, y2: number): string {
  const middle = (x1 + x2) / 2;
  return `C${middle} ${y1} ${middle} ${y2} ${x2} ${y2}`;
}
