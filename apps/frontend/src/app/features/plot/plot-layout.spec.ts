import type { ManuscriptNode, Strand } from '@wortomat/shared';
import {
  BUNDLE_GAP,
  GROUP_GAP,
  layoutPlot,
  linePath,
  NODE_SIZE,
  PLOT_GEOMETRY,
  type PlotColumnInput,
  type PlotScene,
} from './plot-layout';

const { columnWidth: COLUMN_WIDTH, laneHeight: LANE_HEIGHT } = PLOT_GEOMETRY.regular;

const node = (id: string, kind: ManuscriptNode['kind']): ManuscriptNode => ({
  id,
  parentId: null,
  kind,
  title: id,
  sortOrder: 0,
  wordCount: 0,
  status: kind === 'scene' ? 'idea' : null,
  annotations: null,
  turningPoint: kind === 'scene' ? false : null,
  storyOrder: null,
});

const strand = (id: string): Strand => ({ id, name: id, color: 'violet', sceneCount: 0 });

const K1 = node('K1', 'chapter');
const K2 = node('K2', 'chapter');
let bookNumber = 0;
const scene = (id: string, chapter: ManuscriptNode, strandIds: string[]): PlotScene => ({
  scene: node(id, 'scene'),
  chapter,
  chapterNumber: chapter === K1 ? 1 : 2,
  bookNumber: ++bookNumber,
  strandIds,
});
/** Buchreihenfolge: eine Szene je Spalte, gruppiert nach Kapitel. */
const inBookOrder = (scenes: PlotScene[]): PlotColumnInput[] =>
  scenes.map((entry) => ({
    scenes: [entry],
    group: { id: entry.chapter.id, label: entry.chapter.title, number: entry.chapterNumber },
  }));

const lena = strand('lena');
const tom = strand('tom');
const lane = (index: number) => index * LANE_HEIGHT + LANE_HEIGHT / 2;

describe('layoutPlot', () => {
  const scenes = [
    scene('a', K1, ['lena']),
    scene('b', K1, ['tom', 'lena']),
    scene('c', K2, ['tom']),
    scene('d', K2, []),
  ];

  it('legt die Spalten von links nach rechts an, mit einer Lücke je Gruppe', () => {
    const layout = layoutPlot(inBookOrder(scenes), [lena, tom]);
    const half = COLUMN_WIDTH / 2;
    expect(layout.nodes.map((n) => [n.scene.id, n.x, n.column])).toEqual([
      ['a', half, 0],
      ['b', COLUMN_WIDTH + half, 1],
      ['c', 2 * COLUMN_WIDTH + GROUP_GAP + half, 2],
      ['d', 3 * COLUMN_WIDTH + GROUP_GAP + half, 3],
    ]);
    expect(layout.groups.map((g) => [g.id, g.number, g.x, g.width, g.firstColumn])).toEqual([
      ['K1', 1, 0, 2 * COLUMN_WIDTH, 0],
      ['K2', 2, 2 * COLUMN_WIDTH + GROUP_GAP, 2 * COLUMN_WIDTH, 2],
    ]);
    expect(layout.width).toBe(4 * COLUMN_WIDTH + GROUP_GAP);
  });

  it('legt gemeinsame Szenen mittig zwischen die Stränge und bündelt die Linien', () => {
    const layout = layoutPlot(inBookOrder(scenes), [lena, tom]);
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
    const layout = layoutPlot(inBookOrder(scenes), [lena, tom]);
    expect(layout.lanes.map((l) => [l.strand?.id ?? null, l.y, l.nodeCount])).toEqual([
      ['lena', lane(0), 2],
      ['tom', lane(1), 2],
      [null, lane(2), 1],
    ]);
    expect(layout.nodes[3]!.y).toBe(lane(2));
    expect(layout.height).toBe(3 * LANE_HEIGHT);
  });

  it('ignoriert unbekannte (gelöschte) Stränge', () => {
    const layout = layoutPlot(inBookOrder([scene('a', K1, ['weg'])]), [lena]);
    expect(layout.nodes[0]!.strands).toEqual([]);
    expect(layout.lanes.map((l) => l.strand?.id ?? null)).toEqual(['lena', null]);
  });

  it('stellt gleichzeitige Szenen übereinander – oder nebeneinander, wenn sie sich stören', () => {
    const group = { id: 'start', label: '', number: null };
    const x = scene('x', K1, ['lena']);
    const y = scene('y', K1, ['tom']);
    const z = scene('z', K1, ['lena']);
    // x und y in verschiedenen Zeilen: eine Spalte, übereinander
    const stacked = layoutPlot([{ scenes: [x, y], group }], [lena, tom]);
    expect(stacked.nodes.map((n) => [n.scene.id, n.x, n.y])).toEqual([
      ['x', COLUMN_WIDTH / 2, lane(0)],
      ['y', COLUMN_WIDTH / 2, lane(1)],
    ]);
    expect(stacked.columns).toEqual([{ left: 0, width: COLUMN_WIDTH, sceneIds: ['x', 'y'] }]);
    // x und z im selben Strang: die Spalte wird doppelt so breit
    const spread = layoutPlot([{ scenes: [x, z], group }], [lena, tom]);
    expect(spread.nodes.map((n) => n.x)).toEqual([COLUMN_WIDTH / 2, COLUMN_WIDTH * 1.5]);
    expect(spread.columns[0]!.width).toBe(2 * COLUMN_WIDTH);
    expect(spread.lines[0]!.path).toBe(`M${COLUMN_WIDTH / 2} ${lane(0)} H${COLUMN_WIDTH * 1.5}`);
  });
});

describe('layoutPlot kompakt', () => {
  it('rückt Spalten und Zeilen ohne Titel enger zusammen', () => {
    const { columnWidth, laneHeight } = PLOT_GEOMETRY.compact;
    const group = { id: 'start', label: '', number: null };
    const x = scene('x', K1, ['lena']);
    const y = scene('y', K1, ['tom']);
    const layout = layoutPlot(
      [
        { scenes: [x], group },
        { scenes: [y], group },
      ],
      [lena, tom],
      PLOT_GEOMETRY.compact,
    );
    expect(layout.nodes.map((n) => [n.x, n.y])).toEqual([
      [columnWidth / 2, laneHeight / 2],
      [columnWidth * 1.5, laneHeight * 1.5],
    ]);
    expect([layout.width, layout.height]).toEqual([2 * columnWidth, 2 * laneHeight]);
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
