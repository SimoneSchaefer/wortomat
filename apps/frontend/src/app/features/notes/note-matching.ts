export interface Matchable {
  id: string;
  title: string;
  summary?: string;
}

/** For comparisons: without accents/umlauts, case-insensitive ("Ärztin" → "arztin"). */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Not yet linked notes whose title or summary contains the input. Hits at the start of a title word
 * first.
 */
export function filterCandidates<T extends Matchable>(
  notes: readonly T[],
  excludeIds: ReadonlySet<string>,
  query: string,
): T[] {
  const needle = normalizeForSearch(query);
  const scored = notes
    .filter((note) => !excludeIds.has(note.id))
    .map((note) => {
      const title = normalizeForSearch(note.title);
      if (!needle) return { note, score: 2 };
      if (title.startsWith(needle) || title.includes(` ${needle}`)) return { note, score: 0 };
      if (title.includes(needle)) return { note, score: 1 };
      if (normalizeForSearch(note.summary ?? '').includes(needle)) return { note, score: 2 };
      return null;
    })
    .filter((entry): entry is { note: T; score: number } => entry !== null);
  // Stable sort: within the same score the (alphabetical) input order stays.
  return scored.sort((a, b) => a.score - b.score).map((entry) => entry.note);
}

/** If so, no "create new" is offered. */
export function hasExactTitle(notes: readonly Matchable[], query: string): boolean {
  const needle = normalizeForSearch(query);
  return notes.some((note) => normalizeForSearch(note.title) === needle);
}
