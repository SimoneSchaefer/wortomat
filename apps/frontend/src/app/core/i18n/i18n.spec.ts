import { de } from './de';
import { en } from './en';
import { systemLanguage } from './i18n';

describe('systemLanguage', () => {
  it("takes the system's first known language, otherwise English", () => {
    expect(systemLanguage(['de-DE', 'en-US'])).toBe('de');
    expect(systemLanguage(['de-CH'])).toBe('de');
    expect(systemLanguage(['fr-FR', 'en-GB', 'de'])).toBe('en');
    expect(systemLanguage(['fr-FR', 'de-AT'])).toBe('de');
    expect(systemLanguage(['ja'])).toBe('en');
    expect(systemLanguage([])).toBe('en');
  });
});

describe('texts', () => {
  it('formats numbers and word counts per language', () => {
    expect(de.words(12345)).toBe('12.345 Wörter');
    expect(de.words(1)).toBe('1 Wort');
    expect(en.words(12345)).toBe('12,345 words');
    expect(en.number(0)).toBe('0');
  });
});
