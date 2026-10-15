import type { NoteSummary } from '@wortomat/shared';
import { filterCandidates, hasExactTitle, normalizeForSearch } from './note-matching';

function note(id: string, title: string, summary = ''): NoteSummary {
  return {
    id,
    kind: 'character',
    title,
    summary,
    groupId: null,
    updatedAt: '',
    coverImageUrl: null,
    coverCrop: null,
    annotations: { todo: 0, idea: 0, fixme: 0 },
  };
}

const notes = [
  note('1', 'Anna Berger', 'Protagonistin, Ärztin'),
  note('2', 'Ben Kowalski', 'Annas Bruder'),
  note('3', 'Hanna Özdemir'),
  note('4', 'Tom'),
];

describe('note picker', () => {
  it('ignores umlauts and case', () => {
    expect(normalizeForSearch('  Ärztin Özdemir ')).toBe('arztin ozdemir');
    expect(filterCandidates(notes, new Set(), 'ozde').map((n) => n.id)).toEqual(['3']);
    expect(filterCandidates(notes, new Set(), 'ARZT').map((n) => n.id)).toEqual(['1']);
  });

  it('shows hits at the start of a word before hits inside a word and in the summary', () => {
    // "an": Anna (start) · Hanna (middle) · Ben (only in the summary "Annas Bruder")
    expect(filterCandidates(notes, new Set(), 'an').map((n) => n.id)).toEqual(['1', '3', '2']);
  });

  it('hides notes already linked and shows all others without input', () => {
    expect(filterCandidates(notes, new Set(['1', '4']), '').map((n) => n.id)).toEqual(['2', '3']);
  });

  it('detects exactly equal titles', () => {
    expect(hasExactTitle(notes, 'tom')).toBe(true);
    expect(hasExactTitle(notes, 'Tomas')).toBe(false);
  });
});
