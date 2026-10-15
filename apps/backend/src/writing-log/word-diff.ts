/** From this size (old × new words in the changed range) we stop comparing exactly. */
const MAX_DIFF_CELLS = 4_000_000;

export interface WordDiff {
  added: number;
  removed: number;
}

/**
 * A replaced word counts as one added and one removed – so revising yields a gross count even when
 * the length stays the same.
 */
export function diffWords(before: string, after: string): WordDiff {
  const a = words(before);
  const b = words(after);

  // Drop the common start and end – usually only the changed spot remains.
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

  // Several changes far apart: do not count the common words in between twice. If the range is
  // huge, the length difference is enough.
  if (oldPart.length * newPart.length > MAX_DIFF_CELLS) {
    const delta = newPart.length - oldPart.length;
    return { added: Math.max(0, delta), removed: Math.max(0, -delta) };
  }
  const common = longestCommonSubsequence(oldPart, newPart);
  return { added: newPart.length - common, removed: oldPart.length - common };
}

/** Counts like the editor (Tiptap CharacterCount): runs without whitespace. */
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
