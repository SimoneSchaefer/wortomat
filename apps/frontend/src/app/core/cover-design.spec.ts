import { wrapText } from './cover-design';

describe('wrapText', () => {
  // every character 10 px wide
  const measure = (text: string) => text.length * 10;

  it('bricht an Leerzeichen um, so dass jede Zeile in die Breite passt', () => {
    expect(wrapText('Die Häuser am Fluss', measure, 100)).toEqual(['Die Häuser', 'am Fluss']);
    expect(wrapText('  Kurz  ', measure, 100)).toEqual(['Kurz']);
  });

  it('lässt zu lange Wörter ganz', () => {
    expect(wrapText('Donaudampfschifffahrt ab', measure, 100)).toEqual([
      'Donaudampfschifffahrt',
      'ab',
    ]);
  });
});
