import type { ManuscriptNode, NodeKind, NoteSummary, SceneStatus } from '@wortomat/shared';
import { buildTree } from '../../core/project-store';
import { chapterStats, chapterText, presence, scenesInOrder, statusTotals } from './stats';

function node(
  id: string,
  kind: NodeKind,
  parentId: string | null,
  sortOrder: number,
  wordCount = 0,
  status: SceneStatus | null = kind === 'scene' ? 'idea' : null,
): ManuscriptNode {
  const turningPoint = kind === 'scene' ? false : null;
  return {
    id,
    kind,
    parentId,
    sortOrder,
    title: id,
    wordCount,
    status,
    annotations: null,
    turningPoint,
    storyOrder: null,
  };
}

function note(id: string): NoteSummary {
  return {
    id,
    kind: 'character',
    title: id,
    summary: '',
    groupId: null,
    updatedAt: '',
    coverImageUrl: null,
    coverCrop: null,
    annotations: { todo: 0, idea: 0, fixme: 0 },
  };
}

// a part with two chapters, followed by a chapter without a part
const tree = buildTree([
  node('teil', 'part', null, 1),
  node('k1', 'chapter', 'teil', 1),
  node('s1', 'scene', 'k1', 1, 100, 'final'),
  node('s2', 'scene', 'k1', 2, 50, 'draft'),
  node('k2', 'chapter', 'teil', 2),
  node('s3', 'scene', 'k2', 1, 30, 'draft'),
  node('k3', 'chapter', null, 2),
  node('s4', 'scene', 'k3', 1, 0),
]);

describe('scenesInOrder', () => {
  it('numbers chapters across parts', () => {
    expect(scenesInOrder(tree).map((e) => [e.scene.id, e.chapterNumber])).toEqual([
      ['s1', 1],
      ['s2', 1],
      ['s3', 2],
      ['s4', 3],
    ]);
  });
});

describe('chapterStats', () => {
  it('sums words per chapter and status and remembers the part', () => {
    const [k1, k2, k3] = chapterStats(tree);
    expect(k1).toMatchObject({ number: 1, part: 'teil', words: 150, scenes: 2 });
    expect(k1!.wordsByStatus).toEqual({ idea: 0, outline: 0, draft: 50, revised: 0, final: 100 });
    expect(k2).toMatchObject({ number: 2, part: 'teil', words: 30 });
    expect(k3).toMatchObject({ number: 3, part: null, words: 0, scenes: 1 });
  });
});

describe('statusTotals', () => {
  it('counts words and scenes per status in working order', () => {
    expect(statusTotals(scenesInOrder(tree))).toEqual([
      { status: 'idea', words: 0, scenes: 1 },
      { status: 'outline', words: 0, scenes: 0 },
      { status: 'draft', words: 80, scenes: 2 },
      { status: 'revised', words: 0, scenes: 0 },
      { status: 'final', words: 100, scenes: 1 },
    ]);
  });
});

describe('presence', () => {
  it('sorts by first appearance and lists characters without scenes separately', () => {
    const result = presence(
      scenesInOrder(tree),
      [note('Zora'), note('Anna'), note('Ben'), note('Carl')],
      [
        { sceneId: 's1', noteIds: ['Ben'], tags: [], strandIds: [] },
        { sceneId: 's3', noteIds: ['Anna', 'Zora', 'Ben'], tags: [], strandIds: [] },
        { sceneId: 's4', noteIds: ['Anna'], tags: [], strandIds: [] },
      ],
    );
    expect(result.rows.map((row) => [row.note.id, [...row.appearances], row.words])).toEqual([
      ['Ben', [0, 2], 130],
      // same first appearance: whoever appears more often comes first
      ['Anna', [2, 3], 30],
      ['Zora', [2], 30],
    ]);
    expect(result.absent.map((n) => n.id)).toEqual(['Carl']);
  });
});

describe('chapterText', () => {
  it('sums words, dialogue and sentences per chapter, empty chapters too', () => {
    const result = chapterText(tree, [
      { sceneId: 's1', words: 100, dialogueWords: 40, sentences: 8 },
      { sceneId: 's2', words: 50, dialogueWords: 0, sentences: 4 },
      { sceneId: 's3', words: 30, dialogueWords: 30, sentences: 2 },
    ]);
    expect(
      result.map(({ number, words, dialogueWords, sentences }) => [
        number,
        words,
        dialogueWords,
        sentences,
      ]),
    ).toEqual([
      [1, 150, 40, 12],
      [2, 30, 30, 2],
      [3, 0, 0, 0],
    ]);
  });
});
