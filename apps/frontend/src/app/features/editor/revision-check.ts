import { endsSentence, fillerAt, isContentWord, wordCore } from '../../core/text-analysis';

/** Within this many words the same word counts as a close repetition. */
export const REPETITION_DISTANCE = 40;
/** From this many words a sentence counts as long. */
export const LONG_SENTENCE_WORDS = 35;

export type FindingKind = 'repetition' | 'filler' | 'long' | 'double';

export type Finding =
  | {
      kind: 'repetition';
      from: number;
      to: number;
      word: string;
      /** In words. */
      distance: number;
      other: 'before' | 'after';
    }
  | { kind: 'filler'; from: number; to: number; word: string }
  | { kind: 'long'; from: number; to: number; words: number }
  | { kind: 'double'; from: number; to: number; word: string };

export interface RevisionResult {
  /** Sorted by position. */
  findings: Finding[];
  /** Repetitions counted as pairs, everything else per finding. */
  counts: Record<FindingKind, number>;
}

/** A paragraph (or heading): text and document position of its first character. */
export interface TextBlock {
  text: string;
  start: number;
}

interface Word {
  /** Without punctuation, lowercase. */
  lower: string;
  form: string;
  from: number;
  to: number;
  /** The whole text between whitespace, with punctuation. */
  token: string;
  /** Index of the token in the paragraph – for the next token in sentence detection. */
  tokenIndex: number;
  tokenStart: number;
  tokenEnd: number;
}

const LEADING_PUNCTUATION = /^[^\p{L}\p{N}]+/u;

/**
 * Shares the rules for words, fillers and sentence ends with the text statistics. `names`
 * (lowercase): names of characters and places repeat by necessity – no hints for them.
 */
export function checkRevision(
  blocks: readonly TextBlock[],
  names: ReadonlySet<string>,
): RevisionResult {
  const findings: Finding[] = [];
  const counts: Record<FindingKind, number> = { repetition: 0, filler: 0, long: 0, double: 0 };
  /** Last occurrence per word, across paragraphs. */
  const lastSeen = new Map<string, { ordinal: number; from: number; to: number }>();
  /** Positions already marked as a repetition (start position). */
  const marked = new Set<number>();
  let ordinal = 0;

  for (const block of blocks) {
    const tokens = [...block.text.matchAll(/\S+/g)];
    const words: Word[] = [];
    tokens.forEach((match, tokenIndex) => {
      const token = match[0];
      const form = wordCore(token);
      if (!form) return;
      const lead = token.length - token.replace(LEADING_PUNCTUATION, '').length;
      const from = block.start + match.index + lead;
      words.push({
        lower: form.toLowerCase(),
        form,
        from,
        to: from + form.length,
        token,
        tokenIndex,
        tokenStart: block.start + match.index,
        tokenEnd: block.start + match.index + token.length,
      });
    });
    const lowers = words.map((word) => word.lower);

    let skipFiller = false;
    let sentenceStart: Word | null = null;
    let sentenceWords = 0;
    words.forEach((word, index) => {
      const previous = words[index - 1];
      // "der der": same word, only whitespace between, no punctuation attached
      const isDouble =
        !!previous &&
        previous.lower === word.lower &&
        previous.to === previous.tokenEnd &&
        word.from === word.tokenStart &&
        previous.tokenIndex === word.tokenIndex - 1;
      if (isDouble) {
        findings.push({ kind: 'double', from: previous.from, to: word.to, word: word.form });
        counts.double++;
      }

      const filler = skipFiller ? null : fillerAt(lowers, index);
      if (skipFiller) {
        skipFiller = false;
      } else if (filler) {
        const last = words[index + filler.length - 1]!;
        findings.push({ kind: 'filler', from: word.from, to: last.to, word: filler.filler });
        counts.filler++;
        skipFiller = filler.length === 2;
      } else if (!isDouble && isContentWord(word.lower) && !names.has(word.lower)) {
        const seen = lastSeen.get(word.lower);
        const distance = seen ? ordinal - seen.ordinal : Infinity;
        if (seen && distance <= REPETITION_DISTANCE) {
          if (!marked.has(seen.from)) {
            findings.push({
              kind: 'repetition',
              from: seen.from,
              to: seen.to,
              word: word.form,
              distance,
              other: 'after',
            });
            marked.add(seen.from);
          }
          findings.push({
            kind: 'repetition',
            from: word.from,
            to: word.to,
            word: word.form,
            distance,
            other: 'before',
          });
          marked.add(word.from);
          counts.repetition++;
        }
        lastSeen.set(word.lower, { ordinal, from: word.from, to: word.to });
      }
      ordinal++;

      sentenceStart ??= word;
      sentenceWords++;
      const next = tokens[word.tokenIndex + 1]?.[0];
      const atEnd = index === words.length - 1;
      if (endsSentence(word.token, word.lower, next) || atEnd) {
        if (sentenceWords >= LONG_SENTENCE_WORDS) {
          findings.push({
            kind: 'long',
            from: sentenceStart.from,
            to: word.to,
            words: sentenceWords,
          });
          counts.long++;
        }
        sentenceStart = null;
        sentenceWords = 0;
      }
    });
  }

  findings.sort((a, b) => a.from - b.from || a.to - b.to);
  return { findings, counts };
}
