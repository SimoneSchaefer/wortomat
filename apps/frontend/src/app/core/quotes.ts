import type { QuoteStyle } from '@wortomat/shared';

/** Narrow no-break space – in French between guillemets and text. */
export const NARROW_NBSP = ' ';
export const APOSTROPHE = '’';

/** Opening and closing mark (with spaces where needed), double and single. */
export interface QuoteMarks {
  double: readonly [open: string, close: string];
  single: readonly [open: string, close: string];
}

/** Name of the style: `t().settings.quoteStyles[style]`. */
export interface QuoteStyleInfo {
  style: QuoteStyle;
  /** `null`: replace nothing. */
  marks: QuoteMarks | null;
}

export const QUOTE_STYLES: readonly QuoteStyleInfo[] = [
  { style: 'de', marks: { double: ['„', '“'], single: ['‚', '‘'] } },
  {
    style: 'de-guillemets',
    marks: { double: ['»', '«'], single: ['›', '‹'] },
  },
  {
    style: 'ch',
    marks: { double: ['«', '»'], single: ['‹', '›'] },
  },
  { style: 'en', marks: { double: ['“', '”'], single: ['‘', '’'] } },
  {
    style: 'fr',
    marks: {
      double: [`«${NARROW_NBSP}`, `${NARROW_NBSP}»`],
      single: [`‹${NARROW_NBSP}`, `${NARROW_NBSP}›`],
    },
  },
  { style: 'off', marks: null },
];

export function quoteMarks(style: QuoteStyle): QuoteMarks | null {
  return QUOTE_STYLES.find((info) => info.style === style)?.marks ?? null;
}

export interface QuoteReplacement {
  text: string;
  /** This many characters before the typed one are replaced too (e.g. a space). */
  replaceBefore: number;
}

/** A quote starts after these characters (in addition to whitespace and the opening marks). */
const OPENING_CONTEXT = '([{–—/';

/** @param before paragraph text before the cursor */
export function smartQuote(
  typed: '"' | "'",
  before: string,
  style: QuoteStyle,
): QuoteReplacement | null {
  const marks = quoteMarks(style);
  if (!marks) return null;
  const [open, close] = typed === '"' ? marks.double : marks.single;

  // French is often typed with spaces: "Bonjour \"" closes, the space becomes a narrow no-break
  // space.
  if (style === 'fr' && before.endsWith(' ') && isUnclosed(before, open, close)) {
    return { text: close, replaceBefore: 1 };
  }
  if (opensQuote(before, marks)) {
    return { text: open, replaceBefore: 0 };
  }
  if (typed === '"') {
    return { text: close, replaceBefore: 0 };
  }
  // A single mark right after text closes only if one was opened before – otherwise it is an
  // apostrophe (geht’s, Max’ Hut).
  if (close === APOSTROPHE || isUnclosed(before, open, close)) {
    return { text: close, replaceBefore: 0 };
  }
  return { text: APOSTROPHE, replaceBefore: 0 };
}

/**
 * Drop a space right after a French opening mark – the narrow space is already there ("\"Bonjour"
 * and "\" Bonjour" give the same).
 */
export function swallowsSpace(before: string, style: QuoteStyle): boolean {
  const marks = style === 'fr' ? quoteMarks(style) : null;
  return !!marks && (before.endsWith(marks.double[0]) || before.endsWith(marks.single[0]));
}

function opensQuote(before: string, marks: QuoteMarks): boolean {
  const last = before.at(-1);
  if (last === undefined || /\s/.test(last) || OPENING_CONTEXT.includes(last)) return true;
  // nested: „‚ …
  return before.endsWith(marks.double[0]) || before.endsWith(marks.single[0]);
}

function isUnclosed(before: string, open: string, close: string): boolean {
  return count(before, open) > count(before, close);
}

function count(text: string, part: string): number {
  return text.split(part).length - 1;
}
