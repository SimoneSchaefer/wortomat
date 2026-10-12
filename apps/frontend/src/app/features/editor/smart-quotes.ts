import { Extension, InputRule } from '@tiptap/core';
import type { QuoteStyle } from '@wortomat/shared';
import { type QuoteReplacement, smartQuote, swallowsSpace } from '../../core/quotes';

/** So viel Text vor dem Cursor reicht, um offene Anführungszeichen zu erkennen. */
const CONTEXT_CHARS = 2000;

export interface SmartQuotesOptions {
  /** Wird bei jedem Tastendruck gelesen – eine geänderte Einstellung gilt sofort. */
  style: () => QuoteStyle;
}

/**
 * Ersetzt beim Tippen " und ' durch typografische Anführungszeichen bzw. Apostrophe.
 * Die Rücktaste direkt danach stellt das gerade Zeichen wieder her (Tiptap-Standard für
 * Input-Regeln). In Code wird nichts ersetzt, eingefügter Text bleibt, wie er ist.
 */
export const SmartQuotes = Extension.create<SmartQuotesOptions>({
  name: 'smartQuotes',

  addOptions() {
    return { style: () => 'de' };
  },

  addInputRules() {
    const style = () => this.options.style();
    return [
      replaceTyped(/"$/, (before) => smartQuote('"', before, style())),
      replaceTyped(/'$/, (before) => smartQuote("'", before, style())),
      replaceTyped(/ $/, (before) =>
        swallowsSpace(before, style()) ? { text: '', replaceBefore: 0 } : null,
      ),
    ];
  },
});

/** Regel für ein einzelnes getipptes Zeichen; `replacement` bekommt den Absatztext davor. */
function replaceTyped(
  find: RegExp,
  replacement: (before: string) => QuoteReplacement | null,
): InputRule {
  return new InputRule({
    find,
    handler: ({ state, range }) => {
      // Das getippte Zeichen steht schon im Dokument, `range` umfasst genau dieses.
      const $from = state.doc.resolve(range.from);
      const start = Math.max(0, $from.parentOffset - CONTEXT_CHARS);
      // Zeilenumbrüche & Co. zählen als Leerraum
      const before = $from.parent.textBetween(start, $from.parentOffset, undefined, ' ');
      const result = replacement(before);
      if (!result) return null;
      state.tr.insertText(result.text, range.from - result.replaceBefore, range.to);
      return undefined;
    },
  });
}
