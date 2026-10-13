import type { ManuscriptNode, Strand } from '@wortomat/shared';
import {
  BUNDLE_GAP,
  CHAPTER_GAP,
  COLUMN_WIDTH,
  LANE_HEIGHT,
  layoutPlot,
  linePath,
  NODE_SIZE,
  type PlotScene,
} from './plot-layout';

const node = (id: string, kind: ManuscriptNode['kind'], turningPoint = false): ManuscriptNode => ({
  id,
  parentId: null,
  kind,
  title: id,
  sortOrder: 0,
  wordCount: 0,
  status: kind === 'scene' ? 'idea' : null,
  annotations: null,
  turningPoint: kind === 'scene' ? turningPoint : null,
});

const strand = (id: string): Strand => ({ id, name: id, color: 'violet', sceneCount: 0 });

const K1 = node('K1', 'chapter');
const K2 = node('K2', 'chapter');
const scene = (
  id: string,
  chapter: ManuscriptNode,
  strandIds: string[],
  turningPoint = false,
): PlotScene => ({
  scene: node(id, 'scene', turningPoint),
  chapter,
  chapterNumber: chapter === K1 ? 1 : 2,
  strandIds,
});

const lena = strand('lena');
const tom = strand('tom');
const lane = (index: number) => index * LANE_HEIGHT + LANE_HEIGHT / 2;

describe('layoutPlot', () => {
  const scenes = [
    scene('a', K1, ['lena']),
    scene('b', K1, ['tom', 'lena'], true),
    scene('c', K2, ['tom']),
    scene('d', K2, [], true),
  ];

  it('legt Szenen in Buchreihenfolge als Spalten an, mit einer Lücke je Kapitel', () => {
    const layout = layoutPlot(scenes, [lena, tom], false);
    const half = COLUMN_WIDTH / 2;
    expect(layout.nodes.map((n) => [n.scene.id, n.x])).toEqual([
      ['a', half],
      ['b', COLUMN_WIDTH + half],
      ['c', 2 * COLUMN_WIDTH + CHAPTER_GAP + half],
      ['d', 3 * COLUMN_WIDTH + CHAPTER_GAP + half],
    ]);
    expect(layout.chapters.map((c) => [c.chapter.id, c.x, c.width])).toEqual([
      ['K1', 0, 2 * COLUMN_WIDTH],
      ['K2', 2 * COLUMN_WIDTH + CHAPTER_GAP, 2 * COLUMN_WIDTH],
    ]);
    expect(layout.width).toBe(4 * COLUMN_WIDTH + CHAPTER_GAP);
  });

  it('legt gemeinsame Szenen mittig zwischen die Stränge und bündelt die Linien', () => {
    const layout = layoutPlot(scenes, [lena, tom], false);
    const b = layout.nodes[1]!;
    expect(b.strands.map((s) => s.id)).toEqual(['lena', 'tom']); // Reihenfolge der Zeilen
    expect(b.y).toBe((lane(0) + lane(1)) / 2);
    expect(b.height).toBe(NODE_SIZE + BUNDLE_GAP);
    // Lena läuft oben ein, Tom unten
    expect(layout.lines.find((l) => l.strand.id === 'lena')!.path).toContain(
      `${b.x} ${b.y - BUNDLE_GAP / 2}`,
    );
    expect(layout.lines.find((l) => l.strand.id === 'tom')!.path).toContain(
      `${b.x} ${b.y + BUNDLE_GAP / 2}`,
    );
  });

  it('sammelt Szenen ohne Strang in einer eigenen Zeile', () => {
    const layout = layoutPlot(scenes, [lena, tom], false);
    expect(layout.lanes.map((l) => [l.strand?.id ?? null, l.y, l.nodeCount])).toEqual([
      ['lena', lane(0), 2],
      ['tom', lane(1), 2],
      [null, lane(2), 1],
    ]);
    expect(layout.nodes[3]!.y).toBe(lane(2));
    expect(layout.height).toBe(3 * LANE_HEIGHT);
  });

  it('zeigt auf Wunsch nur Wendepunkte; ein Strang mit einem Knoten hat keine Linie', () => {
    const layout = layoutPlot(scenes, [lena, tom], true);
    expect(layout.nodes.map((n) => n.scene.id)).toEqual(['b', 'd']);
    expect(layout.lines).toEqual([]);
    expect(layout.lanes.map((l) => l.nodeCount)).toEqual([1, 1, 1]);
  });

  it('ignoriert unbekannte (gelöschte) Stränge', () => {
    const layout = layoutPlot([scene('a', K1, ['weg'])], [lena], false);
    expect(layout.nodes[0]!.strands).toEqual([]);
    expect(layout.lanes.map((l) => l.strand?.id ?? null)).toEqual(['lena', null]);
  });
});

describe('linePath', () => {
  it('bleibt gerade, solange die Linie auf ihrer Zeile bleibt', () => {
    expect(
      linePath(
        [
          { x: 10, y: 28 },
          { x: 200, y: 28 },
        ],
        28,
      ),
    ).toBe('M10 28 H200');
  });

  it('kehrt zwischen weit entfernten gemeinsamen Szenen auf die Zeile zurück', () => {
    const path = linePath(
      [
        { x: 0, y: 50 },
        { x: 400, y: 50 },
      ],
      28,
    );
    expect(path).toMatch(/^M0 50 C.* 28 H.* C.* 400 50$/);
  });
});
