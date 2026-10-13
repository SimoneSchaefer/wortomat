import { endsSentence, fillerAt, isContentWord, wordCore } from '../../core/text-analysis';

/** So nah (in Wörtern) gilt dasselbe Wort als Nahwiederholung. */
export const REPETITION_DISTANCE = 40;
/** Ab so vielen Wörtern gilt ein Satz als lang. */
export const LONG_SENTENCE_WORDS = 35;

export type FindingKind = 'repetition' | 'filler' | 'long' | 'double';

export type Finding =
  | {
      kind: 'repetition';
      from: number;
      to: number;
      word: string;
      /** Abstand zur anderen Stelle in Wörtern. */
      distance: number;
      /** Wo die andere Stelle liegt. */
      other: 'before' | 'after';
    }
  | { kind: 'filler'; from: number; to: number; word: string }
  | { kind: 'long'; from: number; to: number; words: number }
  | { kind: 'double'; from: number; to: number; word: string };

export interface RevisionResult {
  /** Nach Position sortiert. */
  findings: Finding[];
  /** Wiederholungen als Paare gezählt, sonst je Stelle. */
  counts: Record<FindingKind, number>;
}

/** Ein Absatz (bzw. eine Überschrift): Text und Dokumentposition seines ersten Zeichens. */
export interface TextBlock {
  text: string;
  start: number;
}

interface Word {
  /** Ohne Satzzeichen, klein. */
  lower: string;
  form: string;
  from: number;
  to: number;
  /** Ganzer Text zwischen Leerräumen, mit Satzzeichen. */
  token: string;
  /** Index des Tokens im Absatz – für das nächste Token bei der Satzerkennung. */
  tokenIndex: number;
  tokenStart: number;
  tokenEnd: number;
}

const LEADING_PUNCTUATION = /^[^\p{L}\p{N}]+/u;

/**
 * Sucht Nahwiederholungen, Füllwörter, lange Sätze und doppelte Wörter. Die Regeln für
 * Wörter, Füllwörter und Satzenden teilt sie mit der Textstatistik.
 * `names` (klein): Namen von Figuren und Orten wiederholen sich zwangsläufig – keine Hinweise.
 */
export function checkRevision(
  blocks: readonly TextBlock[],
  names: ReadonlySet<string>,
): RevisionResult {
  const findings: Finding[] = [];
  const counts: Record<FindingKind, number> = { repetition: 0, filler: 0, long: 0, double: 0 };
  /** Letztes Vorkommen je Wort, über Absätze hinweg. */
  const lastSeen = new Map<string, { ordinal: number; from: number; to: number }>();
  /** Bereits als Wiederholung markierte Stellen (Anfangsposition). */
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
      // „der der“: gleiches Wort, nur Leerraum dazwischen, keine Satzzeichen daran
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
