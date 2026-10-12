import type { ManuscriptNode, MoveNodeRequest, NodeKind } from '@wortomat/shared';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DropPlan {
  /** Element, an dem der Einfügemarker angezeigt wird; `null` = Ende der obersten Ebene. */
  targetId: string | null;
  position: DropPosition;
  request: MoveNodeRequest;
}

/**
 * Welche Art unter welcher Elternart liegen darf (`null` = oberste Ebene).
 * Muss zu `ALLOWED_PARENTS` in apps/backend/src/manuscript/manuscript.service.ts passen.
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
 * Bestimmt, was passiert, wenn `dragged` über `target` losgelassen wird.
 *
 * @param ratio vertikale Zeigerposition innerhalb der Zielzeile (0 = oben, 1 = unten)
 * @returns `null`, wenn der Drop dort nicht erlaubt ist
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
    // z. B. Kapitel über einem Teil: Ränder = davor/danach, Mitte = hinein
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

/** Drop auf freie Fläche unterhalb des Baums: ans Ende der obersten Ebene. */
export function planRootDrop(dragged: ManuscriptNode): DropPlan | null {
  return canContain(null, dragged.kind)
    ? { targetId: null, position: 'after', request: { parentId: null, beforeId: null } }
    : null;
}

/** Ändert der Drop überhaupt etwas? (Vermeidet unnötige Anfragen.) */
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
