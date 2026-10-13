import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeText } from './analyze.js';

const GUILLEMETS = { open: '»', close: '«' };
const GERMAN = { open: '„', close: '“' };

describe('analyzeText', () => {
  it('zählt wörtliche Rede getrennt vom Erzähltext', () => {
    const stats = analyzeText('»Komm her«, sagte Anna. Sie lachte.', GUILLEMETS);
    assert.equal(stats.words, 6);
    assert.equal(stats.dialogueWords, 2);
  });

  it('beendet die Rede am Absatzende, auch ohne schließendes Zeichen', () => {
    const text = '„Ich erzähle dir etwas.\n„Und dann ging ich.“\nDer Regen hörte auf.';
    const stats = analyzeText(text, GERMAN);
    assert.equal(stats.dialogueWords, 8);
    assert.equal(stats.words, 12);
  });

  it('zählt ohne Anführungszeichen-Stil keine Rede', () => {
    assert.equal(analyzeText('»Hallo«', null).dialogueWords, 0);
  });

  it('erkennt Satzenden, aber nicht bei Abkürzungen, Ordnungszahlen und Redebegleitsätzen', () => {
    const count = (text: string) => analyzeText(text, GUILLEMETS).sentences;
    assert.equal(count('Er kam. Sie ging! Warum?'), 3);
    assert.equal(count('Er kam z. B. am 3. Mai mit Dr. Berger.'), 1);
    assert.equal(count('»Komm!«, rief sie. Er kam.'), 2);
    assert.equal(count('Ich … weiß nicht. Vielleicht…'), 2);
  });

  it('zählt einen Absatz ohne Satzzeichen (Überschrift) als einen Satz', () => {
    assert.equal(analyzeText('Kapitel eins\nEs regnete.', null).sentences, 2);
  });

  it('findet Füllwörter, auch aus zwei Wörtern, und zählt sie nicht doppelt', () => {
    const stats = analyzeText('Eigentlich war es ein wenig kalt, eigentlich.', null);
    assert.deepEqual(Object.fromEntries(stats.fillers), { eigentlich: 2, 'ein wenig': 1 });
    assert.equal(stats.wordCounts.has('wenig'), false);
  });

  it('zählt Wörter ohne Funktionswörter, Zahlen und Satzzeichen', () => {
    const stats = analyzeText('Der Blick ging zum Fluss. Ihr Blick! Im Jahr 1920.', null);
    assert.equal(stats.wordCounts.get('blick'), 2);
    assert.deepEqual(Object.fromEntries(stats.wordForms.get('blick')!), { Blick: 2 });
    assert.equal(stats.wordCounts.get('fluss'), 1);
    assert.equal(stats.wordCounts.has('der'), false);
    assert.equal(stats.wordCounts.has('1920'), false);
  });
});
