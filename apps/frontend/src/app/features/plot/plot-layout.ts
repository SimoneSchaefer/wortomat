import type { ManuscriptNode, Strand } from '@wortomat/shared';

/** Breite einer Spalte, in Pixeln – breit genug für den Titel unter dem Knoten. */
export const COLUMN_WIDTH = 120;
/** Zusätzliche Lücke zwischen zwei Gruppen (Kapitel bzw. Abschnitte der Handlung). */
export const GROUP_GAP = 18;
/** Abstand der Stränge (Spuren) untereinander – Platz für zwei Zeilen Titel unter dem Knoten. */
export const LANE_HEIGHT = 88;
/** Durchmesser eines Szenenknotens. */
export const NODE_SIZE = 20;
/** Abstand der Linien, die gebündelt in eine gemeinsame Szene einlaufen. */
export const BUNDLE_GAP = 7;
/** Strecke, auf der eine Linie zwischen Spur und gemeinsamer Szene umbiegt. */
const BEND = 40;
/** So weit reicht der Titel unter einen Knoten. */
const LABEL_REACH = 40;

/** Eine Szene mit ihrem Kapitel und ihren Strängen. */
export interface PlotScene {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  /** Laufende Nummer des Kapitels im Buch (ab 1). */
  chapterNumber: number;
  /** Position im Buch (ab 1). */
  bookNumber: number;
  strandIds: readonly string[];
}

/** Kapitel (Buchreihenfolge) bzw. Abschnitt der Handlung, z. B. „Tag 1“. */
export interface PlotGroupInfo {
  id: string;
  /** Leer beim Abschnitt vor der ersten Marke. */
  label: string;
  /** Kapitelnummer; `null` bei Abschnitten. */
  number: number | null;
}

/** Eingabe: Szenen, die gleichzeitig passieren (in Buchreihenfolge: immer nur eine). */
export interface PlotColumnInput {
  scenes: readonly PlotScene[];
  group: PlotGroupInfo;
}

/** Eine Zeile der Übersicht: ein Strang oder die Sammelzeile für Szenen ohne Strang. */
export interface PlotLane {
  /** `null` = „Ohne Strang“ */
  strand: Strand | null;
  y: number;
  /** Wie viele Knoten in dieser Zeile zu sehen sind. */
  nodeCount: number;
}

export interface PlotNode extends PlotScene {
  /** Stränge der Szene in der Reihenfolge der Zeilen. */
  strands: Strand[];
  /** Index der Spalte. */
  column: number;
  x: number;
  /** Mitte des Knotens. */
  y: number;
  /** Höhe: bei mehreren Strängen ein längliches Oval, sonst ein Kreis. */
  height: number;
}

/** Platz einer Spalte – z. B. um beim Ziehen die Stelle unter dem Mauszeiger zu finden. */
export interface PlotColumn {
  left: number;
  width: number;
  sceneIds: string[];
}

export interface PlotLine {
  strand: Strand;
  /** SVG-Pfad (`d`). */
  path: string;
}

/** Kopf über den Spalten einer Gruppe. */
export interface PlotGroup extends PlotGroupInfo {
  /** Linke Kante und Breite des Bereichs. */
  x: number;
  width: number;
  /** Index der ersten Spalte. */
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
 * Ordnet die Spalten von links nach rechts und die Stränge als Zeilen an. Eine Szene in mehreren
 * Strängen liegt mittig zwischen deren Zeilen; die Linien biegen dorthin ab, laufen gebündelt
 * ein und kehren danach in ihre Zeile zurück. Gleichzeitige Szenen stehen übereinander; kämen
 * sie sich (samt Titel) in die Quere, bekommt die Spalte nebeneinanderliegende Plätze.
 */
export function layoutPlot(
  input: readonly PlotColumnInput[],
  strands: readonly Strand[],
): PlotLayout {
  const laneIndex = new Map(strands.map((strand, index) => [strand.id, index]));
  const strandsOf = (entry: PlotScene) =>
    entry.strandIds
      .filter((id) => laneIndex.has(id))
      .sort((a, b) => laneIndex.get(a)! - laneIndex.get(b)!)
      .map((id) => strands[laneIndex.get(id)!]!);

  const laneY = (index: number) => index * LANE_HEIGHT + LANE_HEIGHT / 2;
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
  /** Wo jede Linie in ihre Knoten einläuft, je Strang von links nach rechts. */
  const anchors = new Map<string, Array<{ x: number; y: number }>>();
  let left = 0;
  input.forEach((column, columnIndex) => {
    let group = groups.at(-1);
    if (group?.id !== column.group.id) {
      if (group) left += GROUP_GAP;
      group = { ...column.group, x: left, width: 0, firstColumn: columnIndex };
      groups.push(group);
    }

    // Erst die Höhe jedes Knotens, dann Plätze nebeneinander verteilen, wo nötig
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
      const bottom = node.y + node.height / 2 + LABEL_REACH;
      let slot = slots.findIndex((taken) =>
        taken.every((other) => bottom <= other.top || top >= other.bottom),
      );
      if (slot < 0) slot = slots.push([]) - 1;
      slots[slot]!.push({ top, bottom });
      node.slot = slot;
    }
    const width = Math.max(1, slots.length) * COLUMN_WIDTH;
    columns.push({ left, width, sceneIds: column.scenes.map((entry) => entry.scene.id) });

    for (const node of placed) {
      const x = left + node.slot * COLUMN_WIDTH + COLUMN_WIDTH / 2;
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
    height: laneY(lanes.length) - LANE_HEIGHT / 2,
    lanes,
    nodes,
    columns,
    lines,
    groups,
  };
}

/**
 * Pfad einer Linie durch ihre Knoten. Zwischen zwei Knoten verläuft sie auf ihrer Zeile `laneY`
 * und biegt nur kurz vor bzw. nach einer gemeinsamen Szene ab.
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

/** Weiche S-Kurve von (x1, y1) nach (x2, y2) mit waagrechten Enden. */
function curve(x1: number, y1: number, x2: number, y2: number): string {
  const middle = (x1 + x2) / 2;
  return `C${middle} ${y1} ${middle} ${y2} ${x2} ${y2}`;
}
