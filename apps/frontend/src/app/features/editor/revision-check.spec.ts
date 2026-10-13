import { checkRevision, LONG_SENTENCE_WORDS, REPETITION_DISTANCE } from './revision-check';

/** Absätze ab Position 1, jeweils mit Abstand wie im Dokument (Absatzgrenze = 2 Positionen). */
function blocks(...texts: string[]) {
  let start = 1;
  return texts.map((text) => {
    const block = { text, start };
    start += text.length + 2;
    return block;
  });
}

const NO_NAMES = new Set<string>();

/** Markierter Text je Fundstelle, z. B. `repetition:Blick`. */
function marks(texts: string[], names: ReadonlySet<string> = NO_NAMES) {
  const all = texts.join('\n\n');
  const result = checkRevision(blocks(...texts), names);
  // Position → Zeichen im zusammengesetzten Text (Absatzgrenze zählt 2, wie "\n\n")
  return result.findings.map((f) => `${f.kind}:${all.slice(f.from - 1, f.to - 1)}`);
}

describe('checkRevision', () => {
  it('markiert beide Stellen einer Nahwiederholung und zählt sie als ein Paar', () => {
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

  it('erkennt Wiederholungen über Absätze hinweg, aber nicht jenseits des Abstands', () => {
    expect(marks(['Der Blick.', 'Ein Blick.'])).toEqual(['repetition:Blick', 'repetition:Blick']);
    const filler = Array.from({ length: REPETITION_DISTANCE }, (_, i) => `wort${i}`).join(' ');
    // (der Testsatz ist selbst lang – nur die Wiederholungen ansehen)
    expect(marks([`Blick ${filler} Blick`]).filter((m) => m.startsWith('repetition'))).toEqual([]);
  });

  it('übergeht Funktionswörter und Namen von Figuren und Orten', () => {
    expect(marks(['Anna sah Anna. Und und so.'], new Set(['anna']))).toEqual(['double:Und und']);
  });

  it('markiert Füllwörter, auch aus zwei Wörtern', () => {
    expect(marks(['Er war eigentlich ein wenig müde.'])).toEqual([
      'filler:eigentlich',
      'filler:ein wenig',
    ]);
  });

  it('markiert doppelte Wörter nur ohne Satzzeichen dazwischen', () => {
    expect(marks(['Er sah den den Fluss.'])).toEqual(['double:den den']);
    // mit Komma ist es kein Tippfehler, sondern höchstens eine Wiederholung
    expect(marks(['»Komm, komm!«']).filter((m) => m.startsWith('double'))).toEqual([]);
  });

  it('markiert lange Sätze, Absatzende beendet einen Satz', () => {
    const long = Array.from({ length: LONG_SENTENCE_WORDS }, (_, i) => `w${i}`).join(' ') + '.';
    const short = Array.from({ length: LONG_SENTENCE_WORDS - 1 }, (_, i) => `x${i}`).join(' ');
    const result = checkRevision(blocks(long, short), NO_NAMES);
    expect(result.counts.long).toBe(1);
    expect(result.findings[0]).toMatchObject({ kind: 'long', from: 1, words: LONG_SENTENCE_WORDS });
  });

  it('setzt die Markierung genau auf das Wort ohne Satzzeichen', () => {
    expect(marks(['»Blick«, sagte er. (Blick!)'])).toEqual([
      'repetition:Blick',
      'repetition:Blick',
    ]);
  });
});
