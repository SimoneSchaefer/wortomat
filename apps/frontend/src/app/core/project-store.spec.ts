import type { AnnotationCounts, ManuscriptNode, NodeKind } from '@wortomat/shared';
import { buildTree } from './project-store';

function node(
  id: string,
  kind: NodeKind,
  parentId: string | null,
  sortOrder: number,
  annotations: AnnotationCounts | null = null,
  wordCount = 0,
): ManuscriptNode {
  const turningPoint = kind === 'scene' ? false : null;
  return {
    id,
    kind,
    parentId,
    sortOrder,
    title: id,
    wordCount,
    status: null,
    annotations,
    turningPoint,
  };
}

describe('buildTree', () => {
  it('summiert die Markierungen der Szenen für Kapitel und Teile', () => {
    const tree = buildTree([
      node('teil', 'part', null, 1),
      node('k1', 'chapter', 'teil', 1),
      node('s1', 'scene', 'k1', 1, { todo: 2, idea: 0, fixme: 1 }),
      node('s2', 'scene', 'k1', 2, { todo: 1, idea: 3, fixme: 0 }),
      node('k2', 'chapter', 'teil', 2),
      node('s3', 'scene', 'k2', 1, { todo: 0, idea: 0, fixme: 4 }),
      node('leer', 'chapter', null, 2),
    ]);
    const [teil, leer] = tree;
    expect(teil!.annotations).toEqual({ todo: 3, idea: 3, fixme: 5 });
    expect(teil!.children.map((c) => c.annotations)).toEqual([
      { todo: 3, idea: 3, fixme: 1 },
      { todo: 0, idea: 0, fixme: 4 },
    ]);
    expect(leer!.annotations).toEqual({ todo: 0, idea: 0, fixme: 0 });
  });

  it('summiert die Wortzahlen der Szenen für Kapitel und Teile', () => {
    const tree = buildTree([
      node('teil', 'part', null, 1),
      node('k1', 'chapter', 'teil', 1),
      node('s1', 'scene', 'k1', 1, null, 120),
      node('s2', 'scene', 'k1', 2, null, 80),
      node('k2', 'chapter', 'teil', 2),
      node('s3', 'scene', 'k2', 1, null, 5),
      node('leer', 'chapter', null, 2),
    ]);
    const [teil, leer] = tree;
    expect(teil!.wordCount).toBe(205);
    expect(teil!.children.map((c) => c.wordCount)).toEqual([200, 5]);
    expect(leer!.wordCount).toBe(0);
  });
});
