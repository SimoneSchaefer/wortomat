import type { AnnotationCounts, AnnotationKind } from '@wortomat/shared';

const KINDS: readonly AnnotationKind[] = ['todo', 'idea', 'fixme'];

interface JsonNode {
  type?: unknown;
  content?: unknown;
  marks?: unknown;
}

/**
 * Counts contiguous stretches: Tiptap splits marked text into several text nodes as soon as, say,
 * one word is bold – that should still be one mark. A stretch ends at the end of the paragraph or
 * where the mark stops.
 */
export function countAnnotations(doc: unknown): AnnotationCounts {
  const counts: AnnotationCounts = { todo: 0, idea: 0, fixme: 0 };

  const visit = (node: JsonNode) => {
    const children = Array.isArray(node?.content) ? (node.content as JsonNode[]) : [];
    let previous = new Set<AnnotationKind>();
    for (const child of children) {
      if (isInline(child)) {
        const kinds = annotationKinds(child);
        for (const kind of kinds) {
          if (!previous.has(kind)) counts[kind]++;
        }
        previous = kinds;
      } else {
        previous = new Set();
        visit(child);
      }
    }
  };

  visit(doc as JsonNode);
  return counts;
}

function isInline(node: JsonNode): boolean {
  return node?.type === 'text' || node?.type === 'hardBreak';
}

function annotationKinds(node: JsonNode): Set<AnnotationKind> {
  const marks = Array.isArray(node.marks) ? (node.marks as Array<Record<string, unknown>>) : [];
  const kinds = new Set<AnnotationKind>();
  for (const mark of marks) {
    const kind = (mark?.['attrs'] as Record<string, unknown> | undefined)?.['kind'];
    if (mark?.['type'] === 'annotation' && KINDS.includes(kind as AnnotationKind)) {
      kinds.add(kind as AnnotationKind);
    }
  }
  return kinds;
}
