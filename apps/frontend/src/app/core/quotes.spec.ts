import type { QuoteStyle } from '@wortomat/shared';
import { NARROW_NBSP, smartQuote, swallowsSpace } from './quotes';

/** Types `input` character by character, replacing like the editor does. */
function type(input: string, style: QuoteStyle): string {
  let text = '';
  for (const char of input) {
    const result =
      char === '"' || char === "'"
        ? smartQuote(char, text, style)
        : char === ' ' && swallowsSpace(text, style)
          ? { text: '', replaceBefore: 0 }
          : null;
    text = result ? text.slice(0, text.length - result.replaceBefore) + result.text : text + char;
  }
  return text;
}

describe('smartQuote', () => {
  it('sets German quotation marks and apostrophes', () => {
    expect(type(`Sie sagte: "Komm 'rein', geht's?"`, 'de')).toBe(
      'Sie sagte: „Komm ‚rein‘, geht’s?“',
    );
    expect(type(`"Hallo"`, 'de')).toBe('„Hallo“');
    expect(type(`Max' Hut`, 'de')).toBe('Max’ Hut');
  });

  it('opens after brackets, dashes and when nested', () => {
    expect(type(`("ja")`, 'de')).toBe('(„ja“)');
    expect(type(`–"so"`, 'de')).toBe('–„so“');
    expect(type(`"'innen'"`, 'de')).toBe('„‚innen‘“');
  });

  it('knows guillemets in both directions', () => {
    expect(type(`"Sag 'bitte'", flüstert's.`, 'de-guillemets')).toBe('»Sag ›bitte‹«, flüstert’s.');
    expect(type(`"Sag 'bitte'", flüstert's.`, 'ch')).toBe('«Sag ‹bitte›», flüstert’s.');
  });

  it('sets English quotation marks', () => {
    expect(type(`"Don't say 'never'"`, 'en')).toBe('“Don’t say ‘never’”');
  });

  it('sets narrow no-break spaces in French – also when typed with spaces', () => {
    const n = NARROW_NBSP;
    expect(type(`"Bonjour"`, 'fr')).toBe(`«${n}Bonjour${n}»`);
    expect(type(`" Bonjour "`, 'fr')).toBe(`«${n}Bonjour${n}»`);
    expect(type(`C'est 'ça'`, 'fr')).toBe(`C’est ‹${n}ça${n}›`);
  });

  it('replaces nothing when switched off', () => {
    expect(type(`"Sag 'bitte'", flüstert's.`, 'off')).toBe(`"Sag 'bitte'", flüstert's.`);
  });
});
