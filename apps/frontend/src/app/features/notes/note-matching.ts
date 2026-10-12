/** Alles, was sich in der Auswahl suchen lässt: Notizen, Tags … */
export interface Matchable {
  id: string;
  title: string;
  summary?: string;
}

/** Für Vergleiche: ohne Akzente/Umlaute, ohne Groß-/Kleinschreibung („Ärztin“ → „arztin“). */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Vorschläge für die Auswahl: noch nicht verknüpfte Notizen, deren Titel oder Kurzbeschreibung
 * die Eingabe enthält. Treffer am Wortanfang des Titels zuerst.
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
  // Stabile Sortierung: innerhalb gleicher Güte bleibt die (alphabetische) Eingangsreihenfolge.
  return scored.sort((a, b) => a.score - b.score).map((entry) => entry.note);
}

/** Gibt es schon eine Notiz mit genau diesem Titel? (Dann kein „neu anlegen“ anbieten.) */
export function hasExactTitle(notes: readonly Matchable[], query: string): boolean {
  const needle = normalizeForSearch(query);
  return notes.some((note) => normalizeForSearch(note.title) === needle);
}
