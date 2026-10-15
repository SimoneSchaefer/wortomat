import { wrapText } from './cover-design';

describe('wrapText', () => {
  // every character 10 px wide
  const measure = (text: string) => text.length * 10;

  it('wraps at spaces so every line fits the width', () => {
    expect(wrapText('Die Häuser am Fluss', measure, 100)).toEqual(['Die Häuser', 'am Fluss']);
    expect(wrapText('  Kurz  ', measure, 100)).toEqual(['Kurz']);
  });

  it('keeps words that are too long whole', () => {
    expect(wrapText('Donaudampfschifffahrt ab', measure, 100)).toEqual([
      'Donaudampfschifffahrt',
      'ab',
    ]);
  });
});
