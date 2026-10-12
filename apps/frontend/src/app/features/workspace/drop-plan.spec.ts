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
  } satisfies ManuscriptNode;
}

// Teil T
//   Kapitel K1: Szenen A, B, C
// Kapitel K2: Szene D
const T = node('T', 'part', null, 1);
const K1 = node('K1', 'chapter', 'T', 1);
const A = node('A', 'scene', 'K1', 1);
const B = node('B', 'scene', 'K1', 2);
const C = node('C', 'scene', 'K1', 3);
const K2 = node('K2', 'chapter', null, 2);
const D = node('D', 'scene', 'K2', 1);
const nodes = [T, K1, A, B, C, K2, D];

describe('planDrop', () => {
  it('setzt eine Szene vor bzw. hinter eine andere', () => {
    expect(planDrop(C, A, 0.2, nodes)).toEqual({
      targetId: 'A',
      position: 'before',
      request: { parentId: 'K1', beforeId: 'A' },
    });
    // "nach A" = vor dem nächsten Geschwister, das nicht die gezogene Szene ist
    expect(planDrop(C, A, 0.8, nodes)?.request).toEqual({ parentId: 'K1', beforeId: 'B' });
    expect(planDrop(A, C, 0.8, nodes)?.request).toEqual({ parentId: 'K1', beforeId: null });
  });

  it('legt eine Szene in ein anderes Kapitel (egal wo in der Zeile)', () => {
    for (const ratio of [0.1, 0.5, 0.9]) {
      expect(planDrop(A, K2, ratio, nodes)).toEqual({
        targetId: 'K2',
        position: 'inside',
        request: { parentId: 'K2', beforeId: null },
      });
    }
  });

  it('nutzt bei Kapitel über Teil die Ränder für davor/danach und die Mitte für hinein', () => {
    expect(planDrop(K2, T, 0.1, nodes)?.position).toBe('before');
    expect(planDrop(K2, T, 0.5, nodes)?.request).toEqual({ parentId: 'T', beforeId: null });
    expect(planDrop(K2, T, 0.9, nodes)?.request).toEqual({ parentId: null, beforeId: null });
  });

  it('verbietet ungültige Ziele', () => {
    expect(planDrop(A, A, 0.5, nodes)).toBeNull(); // auf sich selbst
    expect(planDrop(K1, A, 0.5, nodes)).toBeNull(); // Kapitel neben Szene
    expect(planDrop(T, K1, 0.2, nodes)).toBeNull(); // Teil in den eigenen Teilbaum
    expect(planDrop(T, D, 0.5, nodes)).toBeNull(); // Teil neben Szene
  });
});

describe('planRootDrop', () => {
  it('erlaubt nur Teile und Kapitel auf oberster Ebene', () => {
    expect(planRootDrop(K1)?.request).toEqual({ parentId: null, beforeId: null });
    expect(planRootDrop(A)).toBeNull();
  });
});

describe('changesPosition', () => {
  it('erkennt Drops, die nichts verändern', () => {
    expect(changesPosition(B, planDrop(B, A, 0.8, nodes)!, nodes)).toBe(false); // B nach A
    expect(changesPosition(B, planDrop(B, C, 0.2, nodes)!, nodes)).toBe(false); // B vor C
    expect(changesPosition(B, planDrop(B, A, 0.2, nodes)!, nodes)).toBe(true);
    expect(changesPosition(B, planDrop(B, K2, 0.5, nodes)!, nodes)).toBe(true);
  });
});
