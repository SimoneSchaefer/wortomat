import type { ProofNote } from '@wortomat/shared';

interface JsonNode {
  type?: unknown;
  text?: unknown;
  content?: unknown;
  marks?: unknown;
  attrs?: unknown;
}

/** Ein Absatz (bzw. eine Überschrift …): Block mit Text und Zeilenumbrüchen darin. */
export interface TextBlock {
  /** Laufende Nummer im Dokument (ab 0). */
  index: number;
  /** Reiner Text; Zeilenumbrüche (Shift+Enter) als `\n`. */
  text: string;
  /** Die Inline-Knoten des Blocks – dieses Array wird beim Markieren ersetzt. */
  owner: JsonNode;
}

/** Text und Zeilenumbrüche sind inline; alles mit eigenem Inhalt ist ein Block. */
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
 * Alle Textblöcke eines Tiptap/ProseMirror-Dokuments in Lesereihenfolge. Leere Absätze zählen
 * mit, damit die Nummern in Korrekturfassung und Buch übereinstimmen. Blöcke ohne Text-Inhalt
 * (Bilder, Trenner) zählen nicht.
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

/** Wo eine Notiz im Dokument steht: Block und Zeichenbereich darin. */
export interface Anchor {
  block: TextBlock;
  start: number;
  end: number;
}

/** Wie weit `a` und `b` am Ende (bzw. mit `fromStart` am Anfang) übereinstimmen. */
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
 * Sucht die Stelle einer Notiz: jedes Vorkommen des markierten Texts ist ein Kandidat; es
 * gewinnt, wessen Umgebung am besten zu Text davor/danach passt, bei Gleichstand der Absatz,
 * der der ursprünglichen Nummer am nächsten liegt. `null`, wenn der Text nicht mehr vorkommt.
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
      // Die Umgebung zählt mehr als die Position; die Position entscheidet nur bei Gleichstand
      const score = context * 1000 - Math.abs(block.index - note.paragraph);
      if (!best || score > best.score) best = { anchor: { block, start, end }, score };
    }
  }
  return best?.anchor ?? null;
}

/**
 * Setzt eine Markierung auf einen Bereich des Blocks: Textknoten werden an den Rändern geteilt,
 * eine schon vorhandene Markierung derselben Art (`mark.type`) im Bereich wird ersetzt.
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
