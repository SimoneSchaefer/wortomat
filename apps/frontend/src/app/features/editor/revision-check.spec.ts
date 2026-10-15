import { checkRevision, LONG_SENTENCE_WORDS, REPETITION_DISTANCE } from './revision-check';

/** Paragraphs from position 1, spaced as in the document (paragraph boundary = 2 positions). */
function blocks(...texts: string[]) {
  let start = 1;
  return texts.map((text) => {
    const block = { text, start };
    start += text.length + 2;
    return block;
  });
}

const NO_NAMES = new Set<string>();

/** Marked text per finding, e.g. `repetition:Blick`. */
function marks(texts: string[], names: ReadonlySet<string> = NO_NAMES) {
  const all = texts.join('\n\n');
  const result = checkRevision(blocks(...texts), names);
  // position → character in the joined text (a paragraph boundary counts 2, like "\n\n")
  return result.findings.map((f) => `${f.kind}:${all.slice(f.from - 1, f.to - 1)}`);
}

describe('checkRevision', () => {
  it('marks both passages of a close repetition and counts them as one pair', () => {
    const result = checkRevision(
      blocks('Sein Blick fiel auf den Fluss. Ihr Blick folgte.'),
      NO_NAMES,
    );
    expect(result.counts.repetition).toBe(1);
    expect(marks(['Sein Blick fiel auf den Fluss. Ihr Blick folgte.'])).toEqual([
      'repetition:Blick',
      'repetition:Blick',
    ]);
    expect(result.findings[0]).toMatchObject({ distance: 6, other: 'after' });
    expect(result.findings[1]).toMatchObject({ distance: 6, other: 'before' });
  });

  it('detects repetitions across paragraphs, but not beyond the distance', () => {
    expect(marks(['Der Blick.', 'Ein Blick.'])).toEqual(['repetition:Blick', 'repetition:Blick']);
    const filler = Array.from({ length: REPETITION_DISTANCE }, (_, i) => `wort${i}`).join(' ');
    // (the test sentence is long itself – only look at the repetitions)
    expect(marks([`Blick ${filler} Blick`]).filter((m) => m.startsWith('repetition'))).toEqual([]);
  });

  it('skips function words and names of characters and places', () => {
    expect(marks(['Anna sah Anna. Und und so.'], new Set(['anna']))).toEqual(['double:Und und']);
  });

  it('marks filler words, two-word ones too', () => {
    expect(marks(['Er war eigentlich ein wenig müde.'])).toEqual([
      'filler:eigentlich',
      'filler:ein wenig',
    ]);
  });

  it('marks doubled words only without punctuation between them', () => {
    expect(marks(['Er sah den den Fluss.'])).toEqual(['double:den den']);
    // with a comma it is no typo, at most a repetition
    expect(marks(['»Komm, komm!«']).filter((m) => m.startsWith('double'))).toEqual([]);
  });

  it('marks long sentences; the end of a paragraph ends a sentence', () => {
    const long = Array.from({ length: LONG_SENTENCE_WORDS }, (_, i) => `w${i}`).join(' ') + '.';
    const short = Array.from({ length: LONG_SENTENCE_WORDS - 1 }, (_, i) => `x${i}`).join(' ');
    const result = checkRevision(blocks(long, short), NO_NAMES);
    expect(result.counts.long).toBe(1);
    expect(result.findings[0]).toMatchObject({ kind: 'long', from: 1, words: LONG_SENTENCE_WORDS });
  });

  it('puts the mark exactly on the word without punctuation', () => {
    expect(marks(['»Blick«, sagte er. (Blick!)'])).toEqual([
      'repetition:Blick',
      'repetition:Blick',
    ]);
  });
});
