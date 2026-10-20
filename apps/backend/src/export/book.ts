import type { ManuscriptNode } from '@wortomat/shared';

export interface JsonNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: JsonNode[];
}

export interface BookScene {
  title: string;
  doc: JsonNode;
}

export type BookItem =
  { kind: 'part'; title: string } | { kind: 'chapter'; title: string; scenes: BookScene[] };

/** Format-neutral view of the manuscript in reading order. */
export interface Book {
  title: string;
  author: string;
  wordCount: number;
  /**
   * Characters including spaces – the basis for standard pages (1 standard page = 1800 characters).
   */
  characterCount: number;
  items: BookItem[];
}

export interface ExportOptions {
  includeSceneTitles: boolean;
  /** `undefined`/`null`: each format's own default. */
  sceneBreak?: string | null;
}

/** `null` when unknown. */
export type ImageResolver = (src: string) => ResolvedImage | null;

export interface ResolvedImage {
  mimeType: string;
  data: Buffer;
  width: number | null;
  height: number | null;
}

export const NORMSEITE_CHARACTERS = 1800;

/**
 * Parts become entries of their own, chapters contain their scenes; scenes without text are left
 * out.
 */
export function buildBook(
  meta: { title: string; author: string },
  nodes: readonly ManuscriptNode[],
  docs: ReadonlyMap<string, JsonNode>,
): Book {
  const children = (parentId: string | null) =>
    nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const items: BookItem[] = [];
  let wordCount = 0;
  let characterCount = 0;

  const addChapter = (chapter: ManuscriptNode) => {
    const scenes: BookScene[] = [];
    for (const scene of children(chapter.id)) {
      const doc = docs.get(scene.id);
      if (!doc || !hasText(doc)) continue;
      scenes.push({ title: scene.title, doc });
      wordCount += scene.wordCount;
      characterCount += plainText(doc).length;
    }
    items.push({ kind: 'chapter', title: chapter.title, scenes });
  };

  for (const node of children(null)) {
    if (node.kind === 'part') {
      items.push({ kind: 'part', title: node.title });
      children(node.id)
        .filter((child) => child.kind === 'chapter')
        .forEach(addChapter);
    } else if (node.kind === 'chapter') {
      addChapter(node);
    }
  }

  return { title: meta.title, author: meta.author, wordCount, characterCount, items };
}

export function withoutParts(book: Book): Book {
  return { ...book, items: book.items.filter((item) => item.kind !== 'part') };
}

export function normseiten(book: Book): number {
  return Math.max(1, Math.ceil(book.characterCount / NORMSEITE_CHARACTERS));
}

export function plainText(node: JsonNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  const inner = (node.content ?? []).map(plainText);
  const isBlockContainer = (node.content ?? []).some(
    (child) => child.type !== 'text' && child.type !== 'hardBreak',
  );
  return inner.join(isBlockContainer ? '\n' : '');
}

function hasText(doc: JsonNode): boolean {
  return plainText(doc).trim().length > 0 || containsImage(doc);
}

function containsImage(node: JsonNode): boolean {
  return node.type === 'image' || (node.content ?? []).some(containsImage);
}

/** Todo/idea/fixme are left out on purpose: they are notes to the author, not part of the book. */
export type PrintMark = 'bold' | 'italic' | 'underline' | 'strike' | 'code' | 'link';

export function printMarks(node: JsonNode): Set<PrintMark> {
  const result = new Set<PrintMark>();
  for (const mark of node.marks ?? []) {
    if (['bold', 'italic', 'underline', 'strike', 'code', 'link'].includes(mark.type)) {
      result.add(mark.type as PrintMark);
    }
  }
  return result;
}

export type BlockAlign = 'left' | 'center' | 'right' | 'justify';
const ALIGNMENTS: readonly string[] = ['left', 'center', 'right', 'justify'];
/** As in the editor (Indent extension). */
export const MAX_BLOCK_INDENT = 4;

/**
 * Alignment and indentation of a paragraph or heading, set in the editor's toolbar. `align: null`
 * keeps the template's own (justified novel, ragged standard page).
 */
export function blockFormat(node: JsonNode): { align: BlockAlign | null; indent: number } {
  const align = node.attrs?.['textAlign'];
  const indent = Math.round(Number(node.attrs?.['indent'] ?? 0));
  return {
    align: typeof align === 'string' && ALIGNMENTS.includes(align) ? (align as BlockAlign) : null,
    indent: Number.isFinite(indent) ? Math.max(0, Math.min(MAX_BLOCK_INDENT, indent)) : 0,
  };
}

/** Only these open from an exported book; anything else (javascript: …) stays plain text. */
export function linkHref(node: JsonNode): string | null {
  const href = String(node.marks?.find((m) => m.type === 'link')?.attrs?.['href'] ?? '');
  return /^(https?:|mailto:)/i.test(href) ? href : null;
}

/** Never scales up. */
export function fitImage(
  image: { width: number | null; height: number | null },
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const width = image.width ?? maxWidth;
  const height = image.height ?? Math.round(maxWidth * 0.75);
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function safeFileName(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .trim()
      .slice(0, 120) || 'Manuskript'
  );
}

export function imageSize(data: Buffer): { width: number; height: number } | null {
  if (data.length >= 24 && data.toString('latin1', 1, 4) === 'PNG') {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data.length >= 10 && data.toString('latin1', 0, 3) === 'GIF') {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    // JPEG: walk the segments up to the start-of-frame marker
    let offset = 2;
    while (offset + 9 < data.length && data[offset] === 0xff) {
      const marker = data[offset + 1]!;
      const length = data.readUInt16BE(offset + 2);
      const isStartOfFrame =
        marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isStartOfFrame) {
        return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

export function normseitenLabel(book: Book): string {
  const count = normseiten(book);
  return `${count.toLocaleString('de-DE')} ${count === 1 ? 'Normseite' : 'Normseiten'}`;
}
