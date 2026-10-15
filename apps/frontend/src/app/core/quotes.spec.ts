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
  it('setzt deutsche Anführungszeichen und Apostrophe', () => {
    expect(type(`Sie sagte: "Komm 'rein', geht's?"`, 'de')).toBe(
      'Sie sagte: „Komm ‚rein‘, geht’s?“',
    );
    expect(type(`"Hallo"`, 'de')).toBe('„Hallo“');
    expect(type(`Max' Hut`, 'de')).toBe('Max’ Hut');
  });

  it('öffnet nach Klammern, Gedankenstrichen und verschachtelt', () => {
    expect(type(`("ja")`, 'de')).toBe('(„ja“)');
    expect(type(`–"so"`, 'de')).toBe('–„so“');
    expect(type(`"'innen'"`, 'de')).toBe('„‚innen‘“');
  });

  it('kennt Guillemets in beide Richtungen', () => {
    expect(type(`"Sag 'bitte'", flüstert's.`, 'de-guillemets')).toBe('»Sag ›bitte‹«, flüstert’s.');
    expect(type(`"Sag 'bitte'", flüstert's.`, 'ch')).toBe('«Sag ‹bitte›», flüstert’s.');
  });

  it('setzt englische Anführungszeichen', () => {
    expect(type(`"Don't say 'never'"`, 'en')).toBe('“Don’t say ‘never’”');
  });

  it('setzt im Französischen schmale geschützte Leerzeichen – auch wenn mit Leerzeichen getippt', () => {
    const n = NARROW_NBSP;
    expect(type(`"Bonjour"`, 'fr')).toBe(`«${n}Bonjour${n}»`);
    expect(type(`" Bonjour "`, 'fr')).toBe(`«${n}Bonjour${n}»`);
    expect(type(`C'est 'ça'`, 'fr')).toBe(`C’est ‹${n}ça${n}›`);
  });

  it('ersetzt nichts, wenn ausgeschaltet', () => {
    expect(type(`"Sag 'bitte'", flüstert's.`, 'off')).toBe(`"Sag 'bitte'", flüstert's.`);
  });
});
