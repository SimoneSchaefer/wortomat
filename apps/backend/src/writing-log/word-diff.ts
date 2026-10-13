/** Ab dieser Größe (Wörter alt × neu im geänderten Bereich) wird nicht mehr genau verglichen. */
const MAX_DIFF_CELLS = 4_000_000;

export interface WordDiff {
  added: number;
  removed: number;
}

/**
 * Wie viele Wörter zwischen zwei Fassungen eines Texts dazugekommen bzw. weggefallen sind.
 * Ein ersetztes Wort zählt als eins hinzu und eins weg – so ergibt Überarbeiten ein
 * Brutto, auch wenn die Länge gleich bleibt.
 */
export function diffWords(before: string, after: string): WordDiff {
  const a = words(before);
  const b = words(after);

  // Gleicher Anfang und gleiches Ende fallen weg – meist bleibt nur die Stelle der Änderung.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  const oldPart = a.slice(start, endA);
  const newPart = b.slice(start, endB);
  if (!oldPart.length || !newPart.length) {
    return { added: newPart.length, removed: oldPart.length };
  }

  // Mehrere Änderungen auseinander: gemeinsame Wörter dazwischen nicht doppelt zählen.
  // Ist der Bereich riesig, reicht die Längendifferenz.
  if (oldPart.length * newPart.length > MAX_DIFF_CELLS) {
    const delta = newPart.length - oldPart.length;
    return { added: Math.max(0, delta), removed: Math.max(0, -delta) };
  }
  const common = longestCommonSubsequence(oldPart, newPart);
  return { added: newPart.length - common, removed: oldPart.length - common };
}

/** Zählt wie der Editor (Tiptap CharacterCount): Folgen ohne Leerraum. */
export function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function longestCommonSubsequence(a: readonly string[], b: readonly string[]): number {
  let previous = new Uint32Array(b.length + 1);
  let current = new Uint32Array(b.length + 1);
  for (const word of a) {
    for (let j = 1; j <= b.length; j++) {
      current[j] =
        word === b[j - 1] ? previous[j - 1]! + 1 : Math.max(previous[j]!, current[j - 1]!);
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length]!;
}
