import { analyzeBook, analyzeText, fillerAt, isContentWord } from './text-analysis';

const GUILLEMETS = { open: '»', close: '«' };
const GERMAN = { open: '„', close: '“' };

describe('analyzeText', () => {
  it('zählt wörtliche Rede getrennt vom Erzähltext', () => {
    const stats = analyzeText('»Komm her«, sagte Anna. Sie lachte.', GUILLEMETS);
    expect(stats.words).toBe(6);
    expect(stats.dialogueWords).toBe(2);
  });

  it('beendet die Rede am Absatzende, auch ohne schließendes Zeichen', () => {
    const text = '„Ich erzähle dir etwas.\n„Und dann ging ich.“\nDer Regen hörte auf.';
    const stats = analyzeText(text, GERMAN);
    expect(stats.dialogueWords).toBe(8);
    expect(stats.words).toBe(12);
  });

  it('zählt ohne Anführungszeichen-Stil keine Rede', () => {
    expect(analyzeText('»Hallo«', null).dialogueWords).toBe(0);
  });

  it('erkennt Satzenden, aber nicht bei Abkürzungen, Ordnungszahlen und Redebegleitsätzen', () => {
    const count = (text: string) => analyzeText(text, GUILLEMETS).sentences;
    expect(count('Er kam. Sie ging! Warum?')).toBe(3);
    expect(count('Er kam z. B. am 3. Mai mit Dr. Berger.')).toBe(1);
    expect(count('»Komm!«, rief sie. Er kam.')).toBe(2);
    expect(count('Ich … weiß nicht. Vielleicht…')).toBe(2);
  });

  it('zählt einen Absatz ohne Satzzeichen (Überschrift) als einen Satz', () => {
    expect(analyzeText('Kapitel eins\nEs regnete.', null).sentences).toBe(2);
  });

  it('findet Füllwörter, auch aus zwei Wörtern, und zählt sie nicht doppelt', () => {
    const stats = analyzeText('Eigentlich war es ein wenig kalt, eigentlich.', null);
    expect(Object.fromEntries(stats.fillers)).toEqual({ eigentlich: 2, 'ein wenig': 1 });
    expect(stats.wordCounts.has('wenig')).toBe(false);
  });

  it('zählt Wörter ohne Funktionswörter, Zahlen und Satzzeichen', () => {
    const stats = analyzeText('Der Blick ging zum Fluss. Ihr Blick! Im Jahr 1920.', null);
    expect(stats.wordCounts.get('blick')).toBe(2);
    expect(Object.fromEntries(stats.wordForms.get('blick')!)).toEqual({ Blick: 2 });
    expect(stats.wordCounts.get('fluss')).toBe(1);
    expect(stats.wordCounts.has('der')).toBe(false);
    expect(stats.wordCounts.has('1920')).toBe(false);
  });
});

describe('fillerAt / isContentWord', () => {
  it('erkennt Füllwörter aus einem und zwei Wörtern', () => {
    const words = ['er', 'war', 'ein', 'wenig', 'eigentlich', 'müde'];
    expect(fillerAt(words, 2)).toEqual({ filler: 'ein wenig', length: 2 });
    expect(fillerAt(words, 4)).toEqual({ filler: 'eigentlich', length: 1 });
    expect(fillerAt(words, 5)).toBeNull();
  });

  it('nimmt nur bedeutungstragende Wörter', () => {
    expect(['blick', 'der', 'eigentlich', '1920', 'ja'].map(isContentWord)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });
});

describe('analyzeBook', () => {
  it('summiert die Szenen, ohne Namen und einmalige Wörter, in der häufigsten Schreibweise', () => {
    const stats = analyzeBook(
      [
        { sceneId: 'a', text: '„Komm eigentlich her“, sagte Anna. Der Fluss rauschte.' },
        { sceneId: 'b', text: 'Anna sah den Fluss. Anna Berger lachte.' },
      ],
      GERMAN,
      ['Anna Berger'],
    );
    expect(stats.scenes).toEqual([
      { sceneId: 'a', words: 8, dialogueWords: 3, sentences: 2 },
      { sceneId: 'b', words: 7, dialogueWords: 0, sentences: 2 },
    ]);
    expect(stats.words).toBe(15);
    expect(stats.fillers).toEqual([{ word: 'eigentlich', count: 1 }]);
    expect(stats.topWords).toEqual([{ word: 'Fluss', count: 2 }]);
  });
});
