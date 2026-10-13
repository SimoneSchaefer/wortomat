import type { ManuscriptNode, Strand } from '@wortomat/shared';

/** Abstand der Szenen (Spalten) nebeneinander, in Pixeln – breit genug für den Titel darunter. */
export const COLUMN_WIDTH = 120;
/** Zusätzliche Lücke zwischen zwei Kapiteln. */
export const CHAPTER_GAP = 18;
/** Abstand der Stränge (Spuren) untereinander – Platz für zwei Zeilen Titel unter dem Knoten. */
export const LANE_HEIGHT = 88;
/** Durchmesser eines Szenenknotens. */
export const NODE_SIZE = 20;
/** Abstand der Linien, die gebündelt in eine gemeinsame Szene einlaufen. */
export const BUNDLE_GAP = 7;
/** Strecke, auf der eine Linie zwischen Spur und gemeinsamer Szene umbiegt. */
const BEND = 40;

/** Eine Szene mit ihrem Kapitel und ihren Strängen – in Buchreihenfolge. */
export interface PlotScene {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  /** Laufende Nummer des Kapitels im Buch (ab 1). */
  chapterNumber: number;
  strandIds: readonly string[];
}

/** Eine Zeile der Übersicht: ein Strang oder die Sammelzeile für Szenen ohne Strang. */
export interface PlotLane {
  /** `null` = „Ohne Strang“ */
  strand: Strand | null;
  y: number;
  /** Wie viele Knoten in dieser Zeile zu sehen sind. */
  nodeCount: number;
}

export interface PlotNode {
  scene: ManuscriptNode;
  chapter: ManuscriptNode;
  chapterNumber: number;
  /** Stränge der Szene in der Reihenfolge der Zeilen. */
  strands: Strand[];
  x: number;
  /** Mitte des Knotens. */
  y: number;
  /** Höhe: bei mehreren Strängen ein längliches Oval, sonst ein Kreis. */
  height: number;
}

export interface PlotLine {
  strand: Strand;
  /** SVG-Pfad (`d`). */
  path: string;
}

/** Kopf über den Spalten eines Kapitels. */
export interface PlotChapter {
  chapter: ManuscriptNode;
  number: number;
  /** Linke Kante und Breite des Bereichs. */
  x: number;
  width: number;
}

export interface PlotLayout {
  width: number;
  height: number;
  lanes: PlotLane[];
  nodes: PlotNode[];
  lines: PlotLine[];
  chapters: PlotChapter[];
}

/**
 * Ordnet die Szenen als Spalten (von links nach rechts in Buchreihenfolge) und die Stränge als
 * Zeilen an. Eine Szene in mehreren Strängen liegt mittig zwischen deren Zeilen; die Linien
 * biegen dorthin ab, laufen gebündelt ein und kehren danach in ihre Zeile zurück.
 *
 * @param onlyTurningPoints nur Wendepunkte als Knoten zeigen – die Linien verbinden dann die
 *   Wendepunkte ihres Strangs.
 */
export function layoutPlot(
  scenes: readonly PlotScene[],
  strands: readonly Strand[],
  onlyTurningPoints: boolean,
): PlotLayout {
  const visible = scenes.filter((entry) => !onlyTurningPoints || entry.scene.turningPoint);
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
  const unassigned = visible.some((entry) => strandsOf(entry).length === 0);
  if (unassigned) lanes.push({ strand: null, y: laneY(strands.length), nodeCount: 0 });

  const nodes: PlotNode[] = [];
  const chapters: PlotChapter[] = [];
  /** Wo jede Linie in ihre Knoten einläuft, je Strang in Buchreihenfolge. */
  const anchors = new Map<string, Array<{ x: number; y: number }>>();
  let left = 0;
  for (const entry of visible) {
    let chapter = chapters.at(-1);
    if (chapter?.chapter.id !== entry.chapter.id) {
      if (chapter) left += CHAPTER_GAP;
      chapter = { chapter: entry.chapter, number: entry.chapterNumber, x: left, width: 0 };
      chapters.push(chapter);
    }
    const x = left + COLUMN_WIDTH / 2;
    left += COLUMN_WIDTH;
    chapter.width = left - chapter.x;

    const nodeStrands = strandsOf(entry);
    const rows = nodeStrands.length
      ? nodeStrands.map((strand) => laneIndex.get(strand.id)!)
      : [strands.length];
    const y = rows.reduce((sum, row) => sum + laneY(row), 0) / rows.length;
    for (const row of rows) lanes[row]!.nodeCount++;
    nodeStrands.forEach((strand, index) => {
      const offset = (index - (nodeStrands.length - 1) / 2) * BUNDLE_GAP;
      anchors.set(strand.id, [...(anchors.get(strand.id) ?? []), { x, y: y + offset }]);
    });
    nodes.push({
      scene: entry.scene,
      chapter: entry.chapter,
      chapterNumber: entry.chapterNumber,
      strands: nodeStrands,
      x,
      y,
      height: NODE_SIZE + Math.max(0, nodeStrands.length - 1) * BUNDLE_GAP,
    });
  }

  const lines = strands.flatMap((strand): PlotLine[] => {
    const points = anchors.get(strand.id) ?? [];
    if (points.length < 2) return [];
    return [{ strand, path: linePath(points, laneY(laneIndex.get(strand.id)!)) }];
  });

  return {
    width: left,
    height: laneY(lanes.length) - LANE_HEIGHT / 2,
    lanes,
    nodes,
    lines,
    chapters,
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
