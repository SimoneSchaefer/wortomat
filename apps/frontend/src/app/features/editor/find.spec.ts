import { findMatches } from './find';

/** Paragraphs from position 1, spaced as in the document (paragraph boundary = 2 positions). */
function blocks(...texts: string[]) {
  let start = 1;
  return texts.map((text) => {
    const block = { text, start };
    start += text.length + 2;
    return block;
  });
}

/** The highlighted parts. */
function marked(texts: string[], query: string): string[] {
  const all = blocks(...texts);
  return findMatches(all, query).map(({ from, to }) => {
    const block = all.filter((b) => b.start <= from).at(-1)!;
    return block.text.slice(from - block.start, to - block.start);
  });
}

describe('findMatches', () => {
  it('finds word starts like the search, ignoring case and accents', () => {
    expect(marked(['Am Hafen lag der hafenmeister.', 'Kein Ufer.'], 'hafen')).toEqual([
      'Hafen',
      'hafen',
    ]);
    expect(marked(['Er sprach über Café und Uber.'], 'uber cafe')).toEqual([
      'über',
      'Café',
      'Uber',
    ]);
  });

  it('does not find the term inside a word', () => {
    expect(marked(['Der Seehafen.'], 'hafen')).toEqual([]);
  });

  it('marks the longer term where two start the same word', () => {
    expect(marked(['Im Hausflur, vor dem Haus.'], 'Haus Hausflur')).toEqual(['Hausflur', 'Haus']);
  });

  it('positions matches across paragraphs', () => {
    const [first, second] = blocks('Anna kam.', 'Dann Anna.');
    expect(findMatches([first!, second!], 'anna')).toEqual([
      { from: 1, to: 5 },
      { from: second!.start + 5, to: second!.start + 9 },
    ]);
  });

  it('finds nothing for an empty or punctuation-only term', () => {
    expect(marked(['Text.'], '  ')).toEqual([]);
    expect(marked(['Text.'], '…!')).toEqual([]);
  });
});
