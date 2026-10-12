import { de } from './de';
import { en } from './en';
import { systemLanguage } from './i18n';

describe('systemLanguage', () => {
  it('nimmt die erste bekannte Sprache des Systems, sonst Englisch', () => {
    expect(systemLanguage(['de-DE', 'en-US'])).toBe('de');
    expect(systemLanguage(['de-CH'])).toBe('de');
    expect(systemLanguage(['fr-FR', 'en-GB', 'de'])).toBe('en');
    expect(systemLanguage(['fr-FR', 'de-AT'])).toBe('de');
    expect(systemLanguage(['ja'])).toBe('en');
    expect(systemLanguage([])).toBe('en');
  });
});

describe('Texte', () => {
  it('formatiert Zahlen und Wortzahlen je Sprache', () => {
    expect(de.words(12345)).toBe('12.345 Wörter');
    expect(de.words(1)).toBe('1 Wort');
    expect(en.words(12345)).toBe('12,345 words');
    expect(en.number(0)).toBe('0');
  });
});
