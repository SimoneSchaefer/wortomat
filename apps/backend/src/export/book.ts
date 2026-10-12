import type { ManuscriptNode } from '@wortomat/shared';

/** Ein Knoten im Tiptap/ProseMirror-JSON (nur die Felder, die der Export braucht). */
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

/** Formatneutrales Abbild des Manuskripts in Lesereihenfolge. */
export interface Book {
  title: string;
  author: string;
  wordCount: number;
  /** Zeichen inkl. Leerzeichen – Grundlage für Normseiten (1 Normseite = 1800 Zeichen). */
  characterCount: number;
  items: BookItem[];
}

export interface ExportOptions {
  includeSceneTitles: boolean;
}

/** Bilddaten zu einer `src` wie `/api/images/<id>`; `null`, wenn unbekannt. */
export type ImageResolver = (src: string) => ResolvedImage | null;

export interface ResolvedImage {
  mimeType: string;
  data: Buffer;
  width: number | null;
  height: number | null;
}

export const NORMSEITE_CHARACTERS = 1800;

/**
 * Baut das Buch aus dem Manuskript-Baum. Teile werden zu eigenen Einträgen, Kapitel enthalten
 * ihre Szenen; Szenen ohne Text werden ausgelassen.
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

export function normseiten(book: Book): number {
  return Math.max(1, Math.ceil(book.characterCount / NORMSEITE_CHARACTERS));
}

/** Reiner Text; Absätze werden durch Zeilenumbrüche getrennt. */
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

/** Markierungen, die im Export gedruckt werden; Todo/Idee/Fixme fallen bewusst weg. */
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

/** Bildmaße passend in einen Rahmen skalieren (ohne Hochskalieren). */
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

/** Dateiname ohne Zeichen, die Windows, macOS oder Linux nicht mögen. */
export function safeFileName(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .trim()
      .slice(0, 120) || 'Manuskript'
  );
}

/** Liest Breite/Höhe aus PNG-, GIF- oder JPEG-Daten; `null`, wenn unbekannt. */
export function imageSize(data: Buffer): { width: number; height: number } | null {
  if (data.length >= 24 && data.toString('latin1', 1, 4) === 'PNG') {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if (data.length >= 10 && data.toString('latin1', 0, 3) === 'GIF') {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) };
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    // JPEG: Segmente bis zum „Start of Frame“ durchgehen
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

/** „1 Normseite“, „2 Normseiten“ */
export function normseitenLabel(book: Book): string {
  const count = normseiten(book);
  return `${count.toLocaleString('de-DE')} ${count === 1 ? 'Normseite' : 'Normseiten'}`;
}
