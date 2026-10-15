import { analyzeBook, analyzeText, fillerAt, isContentWord } from './text-analysis';

const GUILLEMETS = { open: '»', close: '«' };
const GERMAN = { open: '„', close: '“' };

describe('analyzeText', () => {
  it('counts direct speech separately from narration', () => {
    const stats = analyzeText('»Komm her«, sagte Anna. Sie lachte.', GUILLEMETS);
    expect(stats.words).toBe(6);
    expect(stats.dialogueWords).toBe(2);
  });

  it('ends speech at the end of the paragraph, even without a closing mark', () => {
    const text = '„Ich erzähle dir etwas.\n„Und dann ging ich.“\nDer Regen hörte auf.';
    const stats = analyzeText(text, GERMAN);
    expect(stats.dialogueWords).toBe(8);
    expect(stats.words).toBe(12);
  });

  it('counts no speech without a quote style', () => {
    expect(analyzeText('»Hallo«', null).dialogueWords).toBe(0);
  });

  it('detects sentence ends, but not at abbreviations, ordinals and speech tags', () => {
    const count = (text: string) => analyzeText(text, GUILLEMETS).sentences;
    expect(count('Er kam. Sie ging! Warum?')).toBe(3);
    expect(count('Er kam z. B. am 3. Mai mit Dr. Berger.')).toBe(1);
    expect(count('»Komm!«, rief sie. Er kam.')).toBe(2);
    expect(count('Ich … weiß nicht. Vielleicht…')).toBe(2);
  });

  it('counts a paragraph without punctuation (heading) as one sentence', () => {
    expect(analyzeText('Kapitel eins\nEs regnete.', null).sentences).toBe(2);
  });

  it('finds filler words, two-word ones too, and does not count them twice', () => {
    const stats = analyzeText('Eigentlich war es ein wenig kalt, eigentlich.', null);
    expect(Object.fromEntries(stats.fillers)).toEqual({ eigentlich: 2, 'ein wenig': 1 });
    expect(stats.wordCounts.has('wenig')).toBe(false);
  });

  it('counts words without function words, numbers and punctuation', () => {
    const stats = analyzeText('Der Blick ging zum Fluss. Ihr Blick! Im Jahr 1920.', null);
    expect(stats.wordCounts.get('blick')).toBe(2);
    expect(Object.fromEntries(stats.wordForms.get('blick')!)).toEqual({ Blick: 2 });
    expect(stats.wordCounts.get('fluss')).toBe(1);
    expect(stats.wordCounts.has('der')).toBe(false);
    expect(stats.wordCounts.has('1920')).toBe(false);
  });
});

describe('fillerAt / isContentWord', () => {
  it('detects one- and two-word fillers', () => {
    const words = ['er', 'war', 'ein', 'wenig', 'eigentlich', 'müde'];
    expect(fillerAt(words, 2)).toEqual({ filler: 'ein wenig', length: 2 });
    expect(fillerAt(words, 4)).toEqual({ filler: 'eigentlich', length: 1 });
    expect(fillerAt(words, 5)).toBeNull();
  });

  it('takes only content words', () => {
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
  it('sums the scenes, without names and one-off words, in the most frequent spelling', () => {
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
