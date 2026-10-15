import type { StoryMark } from '@wortomat/shared';
import { displacedScenes, marksByColumn, moveScene, remapMark, storyColumns } from './story-order';

const ids = (columns: ReturnType<typeof storyColumns>) => columns.map((c) => c.sceneIds);

describe('storyColumns', () => {
  it('folgt dem Buch, solange nichts geordnet ist', () => {
    const columns = storyColumns([
      { id: 'a', storyOrder: null },
      { id: 'b', storyOrder: null },
    ]);
    expect(columns).toEqual([
      { sceneIds: ['a'], value: null },
      { sceneIds: ['b'], value: null },
    ]);
  });

  it('ordnet nach Position; gleiche Position ist eine Spalte', () => {
    const columns = storyColumns([
      { id: 'a', storyOrder: 2 },
      { id: 'b', storyOrder: 2 },
      { id: 'c', storyOrder: 1 },
    ]);
    expect(ids(columns)).toEqual([['c'], ['a', 'b']]);
  });

  it('setzt neue Szenen direkt hinter ihre Vorgängerin im Buch', () => {
    const columns = storyColumns([
      { id: 'neu0', storyOrder: null }, // at the very front of the book: at the very front of the
      // story
      { id: 'a', storyOrder: 3 },
      { id: 'neu1', storyOrder: null },
      { id: 'neu2', storyOrder: null },
      { id: 'b', storyOrder: 1 },
    ]);
    expect(ids(columns)).toEqual([['neu0'], ['b'], ['a'], ['neu1'], ['neu2']]);
  });
});

describe('moveScene', () => {
  const columns = [['a'], ['b', 'c'], ['d']];

  it('legt eine Szene als eigene Spalte vor eine andere oder ans Ende', () => {
    expect(moveScene(columns, 'd', { before: 'a' })).toEqual([['d'], ['a'], ['b', 'c']]);
    expect(moveScene(columns, 'a', { before: null })).toEqual([['b', 'c'], ['d'], ['a']]);
    expect(moveScene(columns, 'b', { before: 'd' })).toEqual([['a'], ['c'], ['b'], ['d']]);
  });

  it('macht eine Szene gleichzeitig mit einer anderen', () => {
    expect(moveScene(columns, 'a', { join: 'd' })).toEqual([
      ['b', 'c'],
      ['d', 'a'],
    ]);
    expect(moveScene(columns, 'c', { join: 'a' })).toEqual([['a', 'c'], ['b'], ['d']]);
  });
});

describe('displacedScenes', () => {
  const book = new Map(['a', 'b', 'c', 'd', 'e'].map((id, i) => [id, i]));

  it('markiert nichts, wenn Buch und Handlung übereinstimmen', () => {
    expect(displacedScenes([['a'], ['b', 'c'], ['d'], ['e']], book)).toEqual(new Set());
  });

  it('markiert nur die Rückblende, nicht alles dazwischen', () => {
    // "e" is at the end of the book but happens first
    expect(displacedScenes([['e'], ['a'], ['b'], ['c'], ['d']], book)).toEqual(new Set(['e']));
    expect(displacedScenes([['a'], ['d'], ['b'], ['c'], ['e']], book)).toEqual(new Set(['d']));
  });
});

describe('marksByColumn', () => {
  const mark = (id: string, position: number): StoryMark => ({ id, label: id, position });

  it('setzt Marken vor die erste Spalte mit passender Position', () => {
    const columns = [
      { sceneIds: ['a'], value: 1 },
      { sceneIds: ['neu'], value: null },
      { sceneIds: ['b'], value: 3 },
    ];
    const result = marksByColumn(columns, [mark('tag2', 2), mark('tag1', 1), mark('weg', 9)]);
    expect([...result].map(([index, m]) => [index, m.id])).toEqual([
      [0, 'tag1'],
      [2, 'tag2'],
    ]);
  });
});

describe('remapMark', () => {
  it('bleibt vor derselben Spalte – auch wenn die verschobene Szene dort allein stand', () => {
    const before = [['a'], ['b'], ['c']];
    expect(remapMark(before, moveScene(before, 'a', { before: null }), 1, 'a')).toBe(0);
    // "b" stood alone after the mark and moves away: the mark stays before "c"
    const after = moveScene(before, 'b', { before: 'a' });
    expect(after[remapMark(before, after, 1, 'b')]).toEqual(['c']);
  });
});
