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
  };
}

const notes = [
  note('1', 'Anna Berger', 'Protagonistin, Ärztin'),
  note('2', 'Ben Kowalski', 'Annas Bruder'),
  note('3', 'Hanna Özdemir'),
  note('4', 'Tom'),
];

describe('Notiz-Auswahl', () => {
  it('ignoriert Umlaute und Groß-/Kleinschreibung', () => {
    expect(normalizeForSearch('  Ärztin Özdemir ')).toBe('arztin ozdemir');
    expect(filterCandidates(notes, new Set(), 'ozde').map((n) => n.id)).toEqual(['3']);
    expect(filterCandidates(notes, new Set(), 'ARZT').map((n) => n.id)).toEqual(['1']);
  });

  it('zeigt Treffer am Wortanfang vor Treffern mitten im Wort und in der Kurzbeschreibung', () => {
    // "an": Anna (Anfang) · Hanna (mitten) · Ben (nur Kurzbeschreibung „Annas Bruder“)
    expect(filterCandidates(notes, new Set(), 'an').map((n) => n.id)).toEqual(['1', '3', '2']);
  });

  it('blendet bereits verknüpfte Notizen aus und zeigt ohne Eingabe alle übrigen', () => {
    expect(filterCandidates(notes, new Set(['1', '4']), '').map((n) => n.id)).toEqual(['2', '3']);
  });

  it('erkennt exakt gleiche Titel', () => {
    expect(hasExactTitle(notes, 'tom')).toBe(true);
    expect(hasExactTitle(notes, 'Tomas')).toBe(false);
  });
});
