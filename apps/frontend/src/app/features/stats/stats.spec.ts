import type { ManuscriptNode, NodeKind, NoteSummary, SceneStatus } from '@wortomat/shared';
import { buildTree } from '../../core/project-store';
import { chapterStats, presence, scenesInOrder, statusTotals } from './stats';

function node(
  id: string,
  kind: NodeKind,
  parentId: string | null,
  sortOrder: number,
  wordCount = 0,
  status: SceneStatus | null = kind === 'scene' ? 'idea' : null,
): ManuscriptNode {
  return { id, kind, parentId, sortOrder, title: id, wordCount, status, annotations: null };
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
  };
}

// Teil mit zwei Kapiteln, dahinter ein Kapitel ohne Teil
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
  it('zählt Kapitel über Teile hinweg durch', () => {
    expect(scenesInOrder(tree).map((e) => [e.scene.id, e.chapterNumber])).toEqual([
      ['s1', 1],
      ['s2', 1],
      ['s3', 2],
      ['s4', 3],
    ]);
  });
});

describe('chapterStats', () => {
  it('summiert Wörter je Kapitel und Status und merkt sich den Teil', () => {
    const [k1, k2, k3] = chapterStats(tree);
    expect(k1).toMatchObject({ number: 1, part: 'teil', words: 150, scenes: 2 });
    expect(k1!.wordsByStatus).toEqual({ idea: 0, outline: 0, draft: 50, revised: 0, final: 100 });
    expect(k2).toMatchObject({ number: 2, part: 'teil', words: 30 });
    expect(k3).toMatchObject({ number: 3, part: null, words: 0, scenes: 1 });
  });
});

describe('statusTotals', () => {
  it('zählt Wörter und Szenen je Status in Arbeitsreihenfolge', () => {
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
  it('sortiert nach erstem Auftritt und listet Figuren ohne Szene extra', () => {
    const result = presence(
      scenesInOrder(tree),
      [note('Zora'), note('Anna'), note('Ben'), note('Carl')],
      [
        { sceneId: 's1', noteIds: ['Ben'], tags: [] },
        { sceneId: 's3', noteIds: ['Anna', 'Zora', 'Ben'], tags: [] },
        { sceneId: 's4', noteIds: ['Anna'], tags: [] },
      ],
    );
    expect(result.rows.map((row) => [row.note.id, [...row.appearances], row.words])).toEqual([
      ['Ben', [0, 2], 130],
      // gleicher erster Auftritt: wer öfter vorkommt, zuerst
      ['Anna', [2, 3], 30],
      ['Zora', [2], 30],
    ]);
    expect(result.absent.map((n) => n.id)).toEqual(['Carl']);
  });
});
