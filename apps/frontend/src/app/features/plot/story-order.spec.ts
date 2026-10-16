import type { StoryMark } from '@wortomat/shared';
import {
  displacedScenes,
  manuscriptPlan,
  marksByColumn,
  moveScene,
  remapMark,
  storyColumns,
} from './story-order';

const ids = (columns: ReturnType<typeof storyColumns>) => columns.map((c) => c.sceneIds);

describe('storyColumns', () => {
  it('follows the book as long as nothing is arranged', () => {
    const columns = storyColumns([
      { id: 'a', storyOrder: null },
      { id: 'b', storyOrder: null },
    ]);
    expect(columns).toEqual([
      { sceneIds: ['a'], value: null },
      { sceneIds: ['b'], value: null },
    ]);
  });

  it('orders by position; the same position is one column', () => {
    const columns = storyColumns([
      { id: 'a', storyOrder: 2 },
      { id: 'b', storyOrder: 2 },
      { id: 'c', storyOrder: 1 },
    ]);
    expect(ids(columns)).toEqual([['c'], ['a', 'b']]);
  });

  it('puts new scenes right after their predecessor in the book', () => {
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

  it('puts a scene as a column of its own before another one or at the end', () => {
    expect(moveScene(columns, 'd', { before: 'a' })).toEqual([['d'], ['a'], ['b', 'c']]);
    expect(moveScene(columns, 'a', { before: null })).toEqual([['b', 'c'], ['d'], ['a']]);
    expect(moveScene(columns, 'b', { before: 'd' })).toEqual([['a'], ['c'], ['b'], ['d']]);
  });

  it('makes a scene simultaneous with another one', () => {
    expect(moveScene(columns, 'a', { join: 'd' })).toEqual([
      ['b', 'c'],
      ['d', 'a'],
    ]);
    expect(moveScene(columns, 'c', { join: 'a' })).toEqual([['a', 'c'], ['b'], ['d']]);
  });
});

describe('displacedScenes', () => {
  const book = new Map(['a', 'b', 'c', 'd', 'e'].map((id, i) => [id, i]));

  it('marks nothing when book and story agree', () => {
    expect(displacedScenes([['a'], ['b', 'c'], ['d'], ['e']], book)).toEqual(new Set());
  });

  it('marks only the flashback, not everything in between', () => {
    // "e" is at the end of the book but happens first
    expect(displacedScenes([['e'], ['a'], ['b'], ['c'], ['d']], book)).toEqual(new Set(['e']));
    expect(displacedScenes([['a'], ['d'], ['b'], ['c'], ['e']], book)).toEqual(new Set(['d']));
  });
});

describe('marksByColumn', () => {
  const mark = (id: string, position: number): StoryMark => ({ id, label: id, position });

  it('puts marks before the first column with a matching position', () => {
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
  it('stays before the same column – even if the moved scene stood alone there', () => {
    const before = [['a'], ['b'], ['c']];
    expect(remapMark(before, moveScene(before, 'a', { before: null }), 1, 'a')).toBe(0);
    // "b" stood alone after the mark and moves away: the mark stays before "c"
    const after = moveScene(before, 'b', { before: 'a' });
    expect(after[remapMark(before, after, 1, 'b')]).toEqual(['c']);
  });
});

describe('manuscriptPlan', () => {
  // K1: A B · K2: C · K3: X
  const book = [
    { id: 'a', chapterId: 'k1' },
    { id: 'b', chapterId: 'k1' },
    { id: 'c', chapterId: 'k2' },
    { id: 'x', chapterId: 'k3' },
  ];

  it('changes nothing while story and book agree', () => {
    expect(manuscriptPlan([['a'], ['b'], ['c'], ['x']], book)).toEqual({
      chapters: [
        { chapterId: 'k1', sceneIds: ['a', 'b'] },
        { chapterId: 'k2', sceneIds: ['c'] },
        { chapterId: 'k3', sceneIds: ['x'] },
      ],
      moves: [],
    });
  });

  it('moves a displaced scene into the chapter of the scene before it', () => {
    const plan = manuscriptPlan([['a'], ['b'], ['x'], ['c']], book);
    expect(plan.chapters).toEqual([
      { chapterId: 'k1', sceneIds: ['a', 'b', 'x'] },
      { chapterId: 'k2', sceneIds: ['c'] },
    ]);
    expect(plan.moves).toEqual([
      { sceneId: 'x', fromChapterId: 'k3', toChapterId: 'k1', afterId: 'b' },
    ]);
  });

  it('puts a scene moved to the very front at the start of the first chapter', () => {
    const plan = manuscriptPlan([['x'], ['a'], ['b'], ['c']], book);
    expect(plan.chapters[0]).toEqual({ chapterId: 'k1', sceneIds: ['x', 'a', 'b'] });
    expect(plan.moves).toEqual([
      { sceneId: 'x', fromChapterId: 'k3', toChapterId: 'k1', afterId: null },
    ]);
  });

  it('reorders within a chapter without changing it', () => {
    const plan = manuscriptPlan([['b'], ['a'], ['c'], ['x']], book);
    expect(plan.chapters[0]).toEqual({ chapterId: 'k1', sceneIds: ['b', 'a'] });
    expect(plan.moves).toHaveLength(1);
    expect(plan.moves[0]!.fromChapterId).toBe(plan.moves[0]!.toChapterId);
  });

  it('keeps simultaneous scenes in book order', () => {
    const plan = manuscriptPlan([['a'], ['x', 'b'], ['c']], book);
    expect(plan.chapters.flatMap((chapter) => chapter.sceneIds)).toEqual(['a', 'b', 'x', 'c']);
  });

  it('makes the manuscript read exactly like the story', () => {
    const story = [['c'], ['x'], ['a'], ['b']];
    const plan = manuscriptPlan(story, book);
    expect(plan.chapters.flatMap((chapter) => chapter.sceneIds)).toEqual(story.flat());
  });
});
