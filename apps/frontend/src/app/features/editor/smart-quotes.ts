import { Extension, InputRule } from '@tiptap/core';
import type { QuoteStyle } from '@wortomat/shared';
import { type QuoteReplacement, smartQuote, swallowsSpace } from '../../core/quotes';

/** This much text before the cursor is enough to detect open quotation marks. */
const CONTEXT_CHARS = 2000;

export interface SmartQuotesOptions {
  /** Read on every keystroke – a changed setting applies right away. */
  style: () => QuoteStyle;
}

/**
 * Backspace right after restores the straight character (Tiptap's default for input rules). Nothing
 * is replaced in code, and pasted text stays as it is.
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

/** `replacement` gets the paragraph text before it. */
function replaceTyped(
  find: RegExp,
  replacement: (before: string) => QuoteReplacement | null,
): InputRule {
  return new InputRule({
    find,
    handler: ({ state, range }) => {
      // The typed character is already in the document; `range` spans exactly that one.
      const $from = state.doc.resolve(range.from);
      const start = Math.max(0, $from.parentOffset - CONTEXT_CHARS);
      // line breaks etc. count as whitespace
      const before = $from.parent.textBetween(start, $from.parentOffset, undefined, ' ');
      const result = replacement(before);
      if (!result) return null;
      state.tr.insertText(result.text, range.from - result.replaceBefore, range.to);
      return undefined;
    },
  });
}
