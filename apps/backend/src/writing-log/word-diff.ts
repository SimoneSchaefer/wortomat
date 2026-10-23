/** From this size (old × new words in the changed range) we stop comparing exactly. */
const MAX_DIFF_CELLS = 4_000_000;
/** Up to this size the changed spots are located exactly, so typos can be looked for there. */
const MAX_TYPO_CELLS = 1_000_000;
/** A larger changed spot is rewritten, not corrected – no typo search there. */
const MAX_GAP_CELLS = 2_500;

export interface WordDiff {
  added: number;
  removed: number;
}

/**
 * A replaced word counts as one added and one removed – so revising yields a gross count even when
 * the length stays the same. Fixing a typo ("Hasue" → "Hause") is no new word, though.
 */
export function diffWords(before: string, after: string): WordDiff {
  const a = words(before).map(comparable);
  const b = words(after).map(comparable);

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
  const common =
    oldPart.length * newPart.length <= MAX_TYPO_CELLS
      ? commonWithTypoFixes(oldPart, newPart)
      : longestCommonSubsequence(oldPart, newPart, () => false);
  return { added: newPart.length - common, removed: oldPart.length - common };
}

/** Counts like the editor (Tiptap CharacterCount): runs without whitespace. */
export function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

const TRIM_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Inserting ", aber" turns "hier." into "hier," – without this the old word would count as
 * rewritten. A changed capital letter after merging two sentences is no new word either, nor is
 * "Strasse" → "Straße".
 */
function comparable(word: string): string {
  return word.replace(TRIM_PUNCTUATION, '').toLowerCase().replaceAll('ß', 'ss');
}

/**
 * One letter wrong, missing, extra or swapped – two from 8 letters on. Short words stay apart:
 * "der" → "die" is a different word, not a typo.
 */
export function isTypoFix(before: string, after: string): boolean {
  const longer = Math.max(before.length, after.length);
  if (longer < 4) return false;
  const allowed = longer < 8 ? 1 : 2;
  if (Math.abs(before.length - after.length) > allowed) return false;
  return editDistance(before, after) <= allowed;
}

/** Optimal string alignment: like Levenshtein, but swapping two neighbours costs one. */
function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, rows[i - 2]![j - 2]! + 1);
      }
      rows[i]![j] = best;
    }
  }
  return rows[a.length]![b.length]!;
}

/**
 * Exact matches first; only the words between them are checked for typos. Checking every pair would
 * also be slow – and would match unrelated words of a rewritten passage.
 */
function commonWithTypoFixes(a: readonly string[], b: readonly string[]): number {
  const width = b.length + 1;
  const table = new Uint32Array((a.length + 1) * width);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      table[i * width + j] =
        a[i - 1] === b[j - 1]
          ? table[(i - 1) * width + j - 1]! + 1
          : Math.max(table[(i - 1) * width + j]!, table[i * width + j - 1]!);
    }
  }

  let common = table[a.length * width + b.length]!;
  let oldGap: string[] = [];
  let newGap: string[] = [];
  const closeGap = () => {
    if (oldGap.length && newGap.length && oldGap.length * newGap.length <= MAX_GAP_CELLS) {
      common += longestCommonSubsequence(oldGap, newGap, isTypoFix);
    }
    oldGap = [];
    newGap = [];
  };
  // Walked backwards – the gaps come out reversed, which does not change their common length.
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      closeGap();
      i--;
      j--;
    } else if (j === 0 || (i > 0 && table[(i - 1) * width + j]! >= table[i * width + j - 1]!)) {
      oldGap.push(a[--i]!);
    } else {
      newGap.push(b[--j]!);
    }
  }
  closeGap();
  return common;
}

function longestCommonSubsequence(
  a: readonly string[],
  b: readonly string[],
  similar: (before: string, after: string) => boolean,
): number {
  let previous = new Uint32Array(b.length + 1);
  let current = new Uint32Array(b.length + 1);
  for (const word of a) {
    for (let j = 1; j <= b.length; j++) {
      const after = b[j - 1]!;
      current[j] =
        word === after || similar(word, after)
          ? previous[j - 1]! + 1
          : Math.max(previous[j]!, current[j - 1]!);
    }
    [previous, current] = [current, previous];
  }
  return previous[b.length]!;
}
