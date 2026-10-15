import type { ProofNote } from '@wortomat/shared';

interface JsonNode {
  type?: unknown;
  text?: unknown;
  content?: unknown;
  marks?: unknown;
  attrs?: unknown;
}

/** A paragraph (or heading …): a block with text and line breaks in it. */
export interface TextBlock {
  index: number;
  /** Line breaks (Shift+Enter) as `\n`. */
  text: string;
  /** This array is replaced when marking. */
  owner: JsonNode;
}

function isInline(node: JsonNode): boolean {
  return node?.type === 'text' || node?.type === 'hardBreak';
}

function childrenOf(node: JsonNode): JsonNode[] {
  return Array.isArray(node?.content) ? (node.content as JsonNode[]) : [];
}

function inlineText(node: JsonNode): string {
  if (node.type === 'hardBreak') return '\n';
  return typeof node.text === 'string' ? node.text : '';
}

/**
 * In reading order. Empty paragraphs count too, so the numbers in the proofreading copy and the
 * book match. Blocks without text content (images, rules) do not count.
 */
export function textBlocks(doc: unknown): TextBlock[] {
  const blocks: TextBlock[] = [];
  const visit = (node: JsonNode) => {
    const children = childrenOf(node);
    const isTextBlock =
      node.type === 'paragraph' || node.type === 'heading' || children.some(isInline);
    if (isTextBlock) {
      blocks.push({ index: blocks.length, text: children.map(inlineText).join(''), owner: node });
      return;
    }
    children.forEach(visit);
  };
  childrenOf(doc as JsonNode).forEach(visit);
  return blocks;
}

export interface Anchor {
  block: TextBlock;
  start: number;
  end: number;
}

/** How far `a` and `b` match at the end (or, with `fromStart`, at the start). */
function overlap(a: string, b: string, fromStart: boolean): number {
  let length = 0;
  const max = Math.min(a.length, b.length);
  while (length < max) {
    const ca = fromStart ? a[length] : a[a.length - 1 - length];
    const cb = fromStart ? b[length] : b[b.length - 1 - length];
    if (ca !== cb) break;
    length++;
  }
  return length;
}

/**
 * Every occurrence of the marked text is a candidate; the one whose surroundings best match the
 * text before and after wins, on a tie the paragraph closest to the original number. `null` when
 * the text no longer occurs.
 */
export function findAnchor(blocks: readonly TextBlock[], note: ProofNote): Anchor | null {
  if (!note.quote) return null;
  let best: { anchor: Anchor; score: number } | null = null;
  for (const block of blocks) {
    for (
      let start = block.text.indexOf(note.quote);
      start >= 0;
      start = block.text.indexOf(note.quote, start + 1)
    ) {
      const end = start + note.quote.length;
      const context =
        overlap(block.text.slice(0, start), note.prefix, false) +
        overlap(block.text.slice(end), note.suffix, true);
      // Surroundings count more than position; position only breaks ties
      const score = context * 1000 - Math.abs(block.index - note.paragraph);
      if (!best || score > best.score) best = { anchor: { block, start, end }, score };
    }
  }
  return best?.anchor ?? null;
}

/**
 * Text nodes are split at the edges; an existing mark of the same type (`mark.type`) in the range
 * is replaced.
 */
export function addMark(anchor: Anchor, mark: { type: string; attrs?: object }): void {
  const result: JsonNode[] = [];
  let offset = 0;
  for (const child of childrenOf(anchor.block.owner)) {
    const length = inlineText(child).length;
    const from = Math.max(anchor.start - offset, 0);
    const to = Math.min(anchor.end - offset, length);
    offset += length;
    if (child.type !== 'text' || from >= to) {
      result.push(child);
      continue;
    }
    const text = child.text as string;
    const marks = Array.isArray(child.marks) ? (child.marks as Array<{ type?: unknown }>) : [];
    const piece = (part: string, withMark: boolean): JsonNode => {
      const pieceMarks = withMark ? [...marks.filter((m) => m.type !== mark.type), mark] : marks;
      return { ...child, text: part, ...(pieceMarks.length ? { marks: pieceMarks } : {}) };
    };
    if (from > 0) result.push(piece(text.slice(0, from), false));
    result.push(piece(text.slice(from, to), true));
    if (to < text.length) result.push(piece(text.slice(to), false));
  }
  anchor.block.owner.content = result;
}
