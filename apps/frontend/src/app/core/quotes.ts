import type { QuoteStyle } from '@wortomat/shared';

/** Schmales geschütztes Leerzeichen – im Französischen zwischen Guillemets und Text. */
export const NARROW_NBSP = ' ';
export const APOSTROPHE = '’';

/** Öffnendes und schließendes Zeichen (ggf. mit Leerzeichen), doppelt und einfach. */
export interface QuoteMarks {
  double: readonly [open: string, close: string];
  single: readonly [open: string, close: string];
}

export interface QuoteStyleInfo {
  style: QuoteStyle;
  label: string;
  /** `null`: nichts ersetzen. */
  marks: QuoteMarks | null;
}

export const QUOTE_STYLES: readonly QuoteStyleInfo[] = [
  { style: 'de', label: 'Deutsch', marks: { double: ['„', '“'], single: ['‚', '‘'] } },
  {
    style: 'de-guillemets',
    label: 'Deutsch, Buchsatz',
    marks: { double: ['»', '«'], single: ['›', '‹'] },
  },
  {
    style: 'ch',
    label: 'Schweiz, Liechtenstein',
    marks: { double: ['«', '»'], single: ['‹', '›'] },
  },
  { style: 'en', label: 'Englisch', marks: { double: ['“', '”'], single: ['‘', '’'] } },
  {
    style: 'fr',
    label: 'Französisch',
    marks: {
      double: [`«${NARROW_NBSP}`, `${NARROW_NBSP}»`],
      single: [`‹${NARROW_NBSP}`, `${NARROW_NBSP}›`],
    },
  },
  { style: 'off', label: 'Nicht ersetzen', marks: null },
];

export function quoteMarks(style: QuoteStyle): QuoteMarks | null {
  return QUOTE_STYLES.find((info) => info.style === style)?.marks ?? null;
}

/** Was statt des getippten Zeichens eingesetzt wird. */
export interface QuoteReplacement {
  text: string;
  /** So viele Zeichen vor dem getippten werden mit ersetzt (z. B. ein Leerzeichen). */
  replaceBefore: number;
}

/** Nach diesen Zeichen beginnt ein Zitat (zusätzlich zu Leerraum und den öffnenden Zeichen). */
const OPENING_CONTEXT = '([{–—/';

/**
 * Typografisches Zeichen für ein getipptes `"` oder `'`.
 * @param before Text des Absatzes vor dem Cursor
 */
export function smartQuote(
  typed: '"' | "'",
  before: string,
  style: QuoteStyle,
): QuoteReplacement | null {
  const marks = quoteMarks(style);
  if (!marks) return null;
  const [open, close] = typed === '"' ? marks.double : marks.single;

  // Französisch wird oft mit Leerzeichen getippt: „Bonjour "“ schließt, das Leerzeichen
  // wird zum schmalen geschützten.
  if (style === 'fr' && before.endsWith(' ') && isUnclosed(before, open, close)) {
    return { text: close, replaceBefore: 1 };
  }
  if (opensQuote(before, marks)) {
    return { text: open, replaceBefore: 0 };
  }
  if (typed === '"') {
    return { text: close, replaceBefore: 0 };
  }
  // Einfaches Zeichen direkt nach Text: schließend nur, wenn vorher eins geöffnet wurde –
  // sonst ist es ein Apostroph (geht’s, Max’ Hut).
  if (close === APOSTROPHE || isUnclosed(before, open, close)) {
    return { text: close, replaceBefore: 0 };
  }
  return { text: APOSTROPHE, replaceBefore: 0 };
}

/**
 * Leerzeichen direkt nach einem französischen öffnenden Zeichen weglassen – das schmale
 * Leerzeichen ist schon da („"Bonjour“ und „" Bonjour“ ergeben dasselbe).
 */
export function swallowsSpace(before: string, style: QuoteStyle): boolean {
  const marks = style === 'fr' ? quoteMarks(style) : null;
  return !!marks && (before.endsWith(marks.double[0]) || before.endsWith(marks.single[0]));
}

function opensQuote(before: string, marks: QuoteMarks): boolean {
  const last = before.at(-1);
  if (last === undefined || /\s/.test(last) || OPENING_CONTEXT.includes(last)) return true;
  // Verschachtelt: „‚ …
  return before.endsWith(marks.double[0]) || before.endsWith(marks.single[0]);
}

function isUnclosed(before: string, open: string, close: string): boolean {
  return count(before, open) > count(before, close);
}

function count(text: string, part: string): number {
  return text.split(part).length - 1;
}
