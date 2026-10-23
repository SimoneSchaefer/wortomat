import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffWords, isTypoFix } from './word-diff.js';
import { writingDay } from './writing-log.service.js';

describe('diffWords', () => {
  it('counts new words at the end', () => {
    assert.deepEqual(diffWords('Es war einmal', 'Es war einmal ein König.'), {
      added: 2,
      removed: 0,
    });
  });

  it('counts replacing as written and deleted (gross)', () => {
    assert.deepEqual(diffWords('Der alte Mann lachte.', 'Der junge Mann lachte.'), {
      added: 1,
      removed: 1,
    });
  });

  it('does not count words between two changes twice', () => {
    assert.deepEqual(diffWords('a b c d e f g', 'X a b c d e f g Y'), { added: 2, removed: 0 });
    assert.deepEqual(diffWords('a b c d e f g', 'X b c d e f Y'), { added: 2, removed: 2 });
  });

  it('does not count a word whose punctuation or capital letter changed', () => {
    assert.deepEqual(diffWords('Er kam hier. Er ging.', 'Er kam hier, aber er ging.'), {
      added: 1,
      removed: 0,
    });
    assert.deepEqual(diffWords('»Komm!«', '»Komm?«'), { added: 0, removed: 0 });
  });

  it('does not count fixing a typo as written', () => {
    assert.deepEqual(diffWords('Er ging nach Hasue.', 'Er ging nach Hause.'), {
      added: 0,
      removed: 0,
    });
    assert.deepEqual(diffWords('Sie lachte laut', 'Sie lachte sehr laut und lange'), {
      added: 3,
      removed: 0,
    });
    assert.deepEqual(
      diffWords('Der Hnud bellte. Es war kalt.', 'Der Hund bellte laut. Es war bitterkalt.'),
      { added: 2, removed: 1 },
    );
    assert.deepEqual(diffWords('Er sah die Strasse.', 'Er sah die Straße.'), {
      added: 0,
      removed: 0,
    });
  });

  it('counts a rewritten passage in full even if words look alike', () => {
    const before = Array.from({ length: 100 }, (_, i) => `wort${i}a`).join(' ');
    const after = Array.from({ length: 100 }, (_, i) => `wort${i}b`).join(' ');
    assert.deepEqual(diffWords(before, after), { added: 100, removed: 100 });
  });

  it('ignores pure whitespace changes', () => {
    assert.deepEqual(diffWords('Es  war\neinmal', 'Es war einmal'), { added: 0, removed: 0 });
  });

  it('compares huge ranges only by length', () => {
    const before = Array.from({ length: 3000 }, (_, i) => `a${i}`).join(' ');
    const after = Array.from({ length: 3500 }, (_, i) => `b${i}`).join(' ');
    assert.deepEqual(diffWords(before, after), { added: 500, removed: 0 });
  });
});

describe('isTypoFix', () => {
  it('accepts one wrong, missing, extra or swapped letter', () => {
    assert.ok(isTypoFix('hasue', 'hause'));
    assert.ok(isTypoFix('hause', 'haus'));
    assert.ok(isTypoFix('gehn', 'gehen'));
    assert.ok(isTypoFix('lachre', 'lachte'));
  });

  it('accepts two mistakes in long words only', () => {
    assert.ok(isTypoFix('vregangenhiet', 'vergangenheit'));
    assert.ok(!isTypoFix('kalt', 'halb'));
  });

  it('keeps short words and real replacements apart', () => {
    assert.ok(!isTypoFix('der', 'die'));
    assert.ok(!isTypoFix('alte', 'junge'));
  });
});

describe('writingDay', () => {
  it('counts night shifts until 4 am towards the previous day', () => {
    assert.equal(writingDay(new Date(2026, 9, 13, 3, 59)), '2026-10-12');
    assert.equal(writingDay(new Date(2026, 9, 13, 4, 0)), '2026-10-13');
    assert.equal(writingDay(new Date(2026, 0, 1, 1, 0)), '2025-12-31');
  });
});
