import type { ManuscriptNode, MoveNodeRequest, NodeKind } from '@wortomat/shared';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DropPlan {
  /** `null` = end of the top level. */
  targetId: string | null;
  position: DropPosition;
  request: MoveNodeRequest;
}

/**
 * `null` = top level. Must match `ALLOWED_PARENTS` in
 * apps/backend/src/manuscript/manuscript.service.ts.
 */
const ALLOWED_PARENTS: Record<NodeKind, ReadonlyArray<NodeKind | null>> = {
  part: [null],
  chapter: [null, 'part'],
  scene: ['chapter'],
};

function canContain(parentKind: NodeKind | null, childKind: NodeKind): boolean {
  return ALLOWED_PARENTS[childKind].includes(parentKind);
}

/**
 * @param ratio vertical pointer position within the target row (0 = top, 1 = bottom)
 * @returns `null` when dropping there is not allowed
 */
export function planDrop(
  dragged: ManuscriptNode,
  target: ManuscriptNode,
  ratio: number,
  nodes: readonly ManuscriptNode[],
): DropPlan | null {
  if (dragged.id === target.id || isDescendant(target, dragged.id, nodes)) {
    return null;
  }

  const parentKind = target.parentId
    ? (nodes.find((node) => node.id === target.parentId)?.kind ?? null)
    : null;
  const canInside = canContain(target.kind, dragged.kind);
  const canBeSibling = canContain(parentKind, dragged.kind);

  let position: DropPosition;
  if (canInside && canBeSibling) {
    // e.g. a chapter over a part: edges = before/after, middle = inside
    position = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
  } else if (canInside) {
    position = 'inside';
  } else if (canBeSibling) {
    position = ratio < 0.5 ? 'before' : 'after';
  } else {
    return null;
  }

  switch (position) {
    case 'inside':
      return { targetId: target.id, position, request: { parentId: target.id, beforeId: null } };
    case 'before':
      return {
        targetId: target.id,
        position,
        request: { parentId: target.parentId, beforeId: target.id },
      };
    case 'after':
      return {
        targetId: target.id,
        position,
        request: {
          parentId: target.parentId,
          beforeId: nextSibling(target, dragged.id, nodes)?.id ?? null,
        },
      };
  }
}

/** Drop onto the free area below the tree: to the end of the top level. */
export function planRootDrop(dragged: ManuscriptNode): DropPlan | null {
  return canContain(null, dragged.kind)
    ? { targetId: null, position: 'after', request: { parentId: null, beforeId: null } }
    : null;
}

/** Avoids needless requests. */
export function changesPosition(
  dragged: ManuscriptNode,
  plan: DropPlan,
  nodes: readonly ManuscriptNode[],
): boolean {
  if (plan.request.parentId !== dragged.parentId) {
    return true;
  }
  const currentNext = nextSibling(dragged, dragged.id, nodes)?.id ?? null;
  return plan.request.beforeId !== currentNext;
}

function nextSibling(
  node: ManuscriptNode,
  excludeId: string,
  nodes: readonly ManuscriptNode[],
): ManuscriptNode | undefined {
  return nodes
    .filter(
      (other) =>
        other.parentId === node.parentId &&
        other.id !== excludeId &&
        other.sortOrder > node.sortOrder,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)[0];
}

function isDescendant(
  node: ManuscriptNode,
  ancestorId: string,
  nodes: readonly ManuscriptNode[],
): boolean {
  let parentId = node.parentId;
  while (parentId) {
    if (parentId === ancestorId) return true;
    parentId = nodes.find((other) => other.id === parentId)?.parentId ?? null;
  }
  return false;
}
