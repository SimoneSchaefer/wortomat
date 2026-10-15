import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { diffWords } from './word-diff.js';
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

  it('ignores pure whitespace changes', () => {
    assert.deepEqual(diffWords('Es  war\neinmal', 'Es war einmal'), { added: 0, removed: 0 });
  });

  it('compares huge ranges only by length', () => {
    const before = Array.from({ length: 3000 }, (_, i) => `a${i}`).join(' ');
    const after = Array.from({ length: 3500 }, (_, i) => `b${i}`).join(' ');
    assert.deepEqual(diffWords(before, after), { added: 500, removed: 0 });
  });
});

describe('writingDay', () => {
  it('counts night shifts until 4 am towards the previous day', () => {
    assert.equal(writingDay(new Date(2026, 9, 13, 3, 59)), '2026-10-12');
    assert.equal(writingDay(new Date(2026, 9, 13, 4, 0)), '2026-10-13');
    assert.equal(writingDay(new Date(2026, 0, 1, 1, 0)), '2025-12-31');
  });
});
