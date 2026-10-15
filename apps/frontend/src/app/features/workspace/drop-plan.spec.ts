import type { ManuscriptNode, NodeKind } from '@wortomat/shared';
import { changesPosition, planDrop, planRootDrop } from './drop-plan';

function node(id: string, kind: NodeKind, parentId: string | null, sortOrder: number) {
  return {
    id,
    kind,
    parentId,
    sortOrder,
    title: id,
    wordCount: 0,
    status: kind === 'scene' ? 'idea' : null,
    annotations: kind === 'scene' ? { todo: 0, idea: 0, fixme: 0 } : null,
    turningPoint: kind === 'scene' ? false : null,
    storyOrder: null,
  } satisfies ManuscriptNode;
}

// Part T
//   Chapter K1: scenes A, B, C
// Chapter K2: scene D
const T = node('T', 'part', null, 1);
const K1 = node('K1', 'chapter', 'T', 1);
const A = node('A', 'scene', 'K1', 1);
const B = node('B', 'scene', 'K1', 2);
const C = node('C', 'scene', 'K1', 3);
const K2 = node('K2', 'chapter', null, 2);
const D = node('D', 'scene', 'K2', 1);
const nodes = [T, K1, A, B, C, K2, D];

describe('planDrop', () => {
  it('puts a scene before or after another one', () => {
    expect(planDrop(C, A, 0.2, nodes)).toEqual({
      targetId: 'A',
      position: 'before',
      request: { parentId: 'K1', beforeId: 'A' },
    });
    // "after A" = before the next sibling that is not the dragged scene
    expect(planDrop(C, A, 0.8, nodes)?.request).toEqual({ parentId: 'K1', beforeId: 'B' });
    expect(planDrop(A, C, 0.8, nodes)?.request).toEqual({ parentId: 'K1', beforeId: null });
  });

  it('moves a scene into another chapter (wherever in the row)', () => {
    for (const ratio of [0.1, 0.5, 0.9]) {
      expect(planDrop(A, K2, ratio, nodes)).toEqual({
        targetId: 'K2',
        position: 'inside',
        request: { parentId: 'K2', beforeId: null },
      });
    }
  });

  it('for a chapter over a part uses the edges for before/after and the middle for inside', () => {
    expect(planDrop(K2, T, 0.1, nodes)?.position).toBe('before');
    expect(planDrop(K2, T, 0.5, nodes)?.request).toEqual({ parentId: 'T', beforeId: null });
    expect(planDrop(K2, T, 0.9, nodes)?.request).toEqual({ parentId: null, beforeId: null });
  });

  it('forbids invalid targets', () => {
    expect(planDrop(A, A, 0.5, nodes)).toBeNull(); // onto itself
    expect(planDrop(K1, A, 0.5, nodes)).toBeNull(); // chapter next to a scene
    expect(planDrop(T, K1, 0.2, nodes)).toBeNull(); // part into its own subtree
    expect(planDrop(T, D, 0.5, nodes)).toBeNull(); // part next to a scene
  });
});

describe('planRootDrop', () => {
  it('allows only parts and chapters at the top level', () => {
    expect(planRootDrop(K1)?.request).toEqual({ parentId: null, beforeId: null });
    expect(planRootDrop(A)).toBeNull();
  });
});

describe('changesPosition', () => {
  it('detects drops that change nothing', () => {
    expect(changesPosition(B, planDrop(B, A, 0.8, nodes)!, nodes)).toBe(false); // B after A
    expect(changesPosition(B, planDrop(B, C, 0.2, nodes)!, nodes)).toBe(false); // B before C
    expect(changesPosition(B, planDrop(B, A, 0.2, nodes)!, nodes)).toBe(true);
    expect(changesPosition(B, planDrop(B, K2, 0.5, nodes)!, nodes)).toBe(true);
  });
});
