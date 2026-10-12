import type { AnnotationCounts, ManuscriptNode, NodeKind } from '@wortomat/shared';
import { buildTree } from './project-store';

function node(
  id: string,
  kind: NodeKind,
  parentId: string | null,
  sortOrder: number,
  annotations: AnnotationCounts | null = null,
): ManuscriptNode {
  return { id, kind, parentId, sortOrder, title: id, wordCount: 0, status: null, annotations };
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
});
