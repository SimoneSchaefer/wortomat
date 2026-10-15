/** Usual e-book cover format (aspect ratio 1 : 1.6). */
export const COVER_WIDTH = 1600;
export const COVER_HEIGHT = 2560;

export interface CoverPalette {
  name: string;
  background: string;
  text: string;
  accent: string;
}

/** "Other style" cycles through them in order. */
export const COVER_PALETTES: readonly CoverPalette[] = [
  { name: 'Nachtblau', background: '#1f2a44', text: '#f3ead8', accent: '#c9a45c' },
  { name: 'Papier', background: '#f2ebdd', text: '#2a2622', accent: '#9b3d2e' },
  { name: 'Waldgrün', background: '#2f4a3a', text: '#f1ecdf', accent: '#d8b86a' },
  { name: 'Bordeaux', background: '#5a1f2b', text: '#f5e9dc', accent: '#e0b872' },
];

const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif";
const MARGIN = 170;

/**
 * Typographic cover from title and author (JPEG, 1600 × 2560 px). Meant as a fallback so the book
 * does not show up as an empty tile in readers.
 */
export async function designCover(
  title: string,
  author: string,
  palette: CoverPalette,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(COVER_WIDTH, COVER_HEIGHT);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Das Titelbild konnte nicht gezeichnet werden.');

  context.fillStyle = palette.background;
  context.fillRect(0, 0, COVER_WIDTH, COVER_HEIGHT);

  context.strokeStyle = palette.accent;
  context.lineWidth = 6;
  context.strokeRect(MARGIN / 2, MARGIN / 2, COVER_WIDTH - MARGIN, COVER_HEIGHT - MARGIN);

  context.fillStyle = palette.text;
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';

  // Title: as large as possible, at most five lines
  const maxWidth = COVER_WIDTH - 2 * MARGIN - 80;
  let size = 190;
  let lines: string[] = [];
  for (; size >= 70; size -= 10) {
    context.font = `400 ${size}px ${SERIF}`;
    lines = wrapText(title, (text) => context.measureText(text).width, maxWidth);
    if (lines.length <= 5 && lines.every((line) => context.measureText(line).width <= maxWidth)) {
      break;
    }
  }
  size = Math.max(size, 70); // if even the smallest size does not fit, keep it
  const lineHeight = size * 1.18;
  const titleTop = COVER_HEIGHT * 0.36 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) =>
    context.fillText(line, COVER_WIDTH / 2, titleTop + index * lineHeight),
  );

  const ruleY = titleTop + (lines.length - 1) * lineHeight + size * 0.9;
  context.fillStyle = palette.accent;
  context.fillRect(COVER_WIDTH / 2 - 120, ruleY, 240, 6);

  if (author.trim()) {
    context.fillStyle = palette.text;
    let authorSize = 92;
    context.font = `italic 400 ${authorSize}px ${SERIF}`;
    while (authorSize > 50 && context.measureText(author).width > maxWidth) {
      authorSize -= 6;
      context.font = `italic 400 ${authorSize}px ${SERIF}`;
    }
    context.fillText(author.trim(), COVER_WIDTH / 2, COVER_HEIGHT * 0.8);
  }

  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
}

/** Single words that are too wide on their own stay whole – then the font has to get smaller. */
export function wrapText(
  text: string,
  measure: (text: string) => number,
  maxWidth: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
