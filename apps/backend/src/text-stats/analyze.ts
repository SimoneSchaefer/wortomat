/**
 * Textstatistik für deutsche Prosa: Dialoganteil, Sätze, Füllwörter, häufige Wörter.
 * Bewusst einfache Regeln – die Zahlen sollen Tendenzen zeigen, keine Linguistik ersetzen.
 */

/** Feste Liste typischer Füllwörter; Mehrwortausdrücke mit Leerzeichen. */
export const FILLER_WORDS: readonly string[] = [
  'eigentlich',
  'plötzlich',
  'irgendwie',
  'ziemlich',
  'wirklich',
  'einfach',
  'eben',
  'halt',
  'quasi',
  'sozusagen',
  'durchaus',
  'letztendlich',
  'natürlich',
  'offensichtlich',
  'regelrecht',
  'total',
  'echt',
  'irgendwann',
  'ein wenig',
  'ein bisschen',
];

/**
 * Häufige Funktionswörter, die bei den „Lieblingswörtern“ nur stören würden
 * (Artikel, Pronomen, Präpositionen, Hilfsverben, Konjunktionen …).
 */
const STOP_WORDS = new Set(
  `aber alle allem allen aller alles als also am an ans auch auf aus bei beim bin bis bist da
  dabei damit dann das dass dein deine dem den denn der des dessen dich die dies diese diesem
  diesen dieser dieses dir doch dort du durch ein eine einem einen einer eines er es etwas euch
  euer für gegen gewesen hab habe haben hat hatte hatten hier hin hinter ich ihm ihn ihnen ihr
  ihre ihrem ihren ihrer im in ins ist ja jede jedem jeden jeder jetzt kann kein keine keinem
  keinen keiner können konnte könnte man mehr mein meine meinem meinen meiner mich mir mit muss
  musste nach nicht nichts noch nun nur ob oder ohne schon sehr sein seine seinem seinen seiner
  seit sich sie sind so soll sollte sondern sonst über um und uns unser unter vom von vor war
  waren warst was weil weiter welche wenn wer werde werden wie wieder will wir wird wo wollte
  worden wurde wurden zu zum zur zwar zwischen sagte sagt fragte ging kam gab sah wieder immer
  einmal mal ganz gar wohl denn selbst schon heute dann wann warum wieso hatten hätte wäre würde
  würden habe gehabt dem den`
    .split(/\s+/)
    .filter(Boolean),
);

/** Gängige Abkürzungen mit Punkt, die kein Satzende sind (klein, ohne Punkt). */
const ABBREVIATIONS = new Set([
  'bzw',
  'ca',
  'dr',
  'etc',
  'evtl',
  'fr',
  'ggf',
  'hr',
  'inkl',
  'nr',
  'prof',
  'st',
  'usw',
  'vgl',
  'jh',
  'mio',
  'mrd',
  'min',
  'max',
  'bspw',
  'zb',
]);

export interface QuotePair {
  open: string;
  close: string;
}

export interface TextStats {
  /** Wörter (Folgen mit mindestens einem Buchstaben oder einer Ziffer). */
  words: number;
  /** Davon in wörtlicher Rede. */
  dialogueWords: number;
  sentences: number;
  /** Füllwort → Anzahl; nur gefundene. */
  fillers: Map<string, number>;
  /** Wort (klein) → Anzahl, ohne Stopp- und Füllwörter. */
  wordCounts: Map<string, number>;
  /** Wort (klein) → Schreibweise → Anzahl, damit „Blick“ groß angezeigt wird. */
  wordForms: Map<string, Map<string, number>>;
}

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const TRIM_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function analyzeText(text: string, quotes: QuotePair | null): TextStats {
  const stats: TextStats = {
    words: 0,
    dialogueWords: 0,
    sentences: 0,
    fillers: new Map(),
    wordCounts: new Map(),
    wordForms: new Map(),
  };
  for (const paragraph of text.split('\n')) {
    analyzeParagraph(paragraph, quotes, stats);
  }
  return stats;
}

function analyzeParagraph(paragraph: string, quotes: QuotePair | null, stats: TextStats): void {
  // Erzähltext und wörtliche Rede trennen. Am Absatzende endet die Rede immer – fehlt das
  // schließende Zeichen (im Deutschen bei Rede über mehrere Absätze üblich), verschluckt sie
  // so höchstens den Rest des Absatzes.
  if (quotes) {
    let inQuote = false;
    let dialogue = '';
    for (const char of paragraph) {
      if (!inQuote && char === quotes.open) inQuote = true;
      else if (inQuote && char === quotes.close) inQuote = false;
      else if (inQuote) dialogue += char;
      else dialogue += ' ';
    }
    stats.dialogueWords += countWords(dialogue);
  }

  const tokens = paragraph.split(/\s+/).filter(Boolean);
  const forms = tokens.map((token) => token.replace(TRIM_PUNCTUATION, ''));
  const words = forms.map((form) => form.toLowerCase());
  let wordsInSentence = 0;
  // zweites Wort eines Füllausdrucks („ein wenig“) – nicht noch einmal einzeln zählen
  let partOfFiller = false;
  tokens.forEach((token, index) => {
    const word = words[index]!;
    if (!word) return;
    stats.words++;
    wordsInSentence++;

    const next = words[index + 1];
    const pair = next ? `${word} ${next}` : null;
    if (partOfFiller) partOfFiller = false;
    else if (pair && FILLER_WORDS.includes(pair)) {
      increment(stats.fillers, pair);
      partOfFiller = true;
    } else if (FILLER_WORDS.includes(word)) increment(stats.fillers, word);
    else if (word.length > 2 && !STOP_WORDS.has(word) && !/^\p{N}+$/u.test(word)) {
      increment(stats.wordCounts, word);
      let wordForms = stats.wordForms.get(word);
      if (!wordForms) stats.wordForms.set(word, (wordForms = new Map()));
      increment(wordForms, forms[index]!);
    }

    if (endsSentence(token, word, tokens[index + 1])) {
      stats.sentences++;
      wordsInSentence = 0;
    }
  });
  // Absatz ohne Satzzeichen am Ende (z. B. eine Überschrift) zählt als ein Satz.
  if (wordsInSentence) stats.sentences++;
}

/**
 * Satzende: Punkt, Ausrufe-/Fragezeichen oder Auslassung am Wortende – außer bei
 * Abkürzungen, Einzelbuchstaben („z. B.“, „J. R.“), Ordnungszahlen („3. Mai“) und wenn das
 * nächste Wort klein beginnt („»Komm!«, rief sie“).
 */
function endsSentence(token: string, word: string, nextToken: string | undefined): boolean {
  const trailing = token.replace(/[»«„“”"'’‹›)\]]+$/u, '');
  if (!/[.!?…]$/u.test(trailing)) return false;
  if (nextToken) {
    const first = nextToken.replace(/^[^\p{L}\p{N}]+/u, '').charAt(0);
    if (first && first === first.toLowerCase() && first !== first.toUpperCase()) return false;
  }
  if (/[!?…]$/u.test(trailing)) return true;
  const bare = word.replace(/\./g, '');
  if (bare.length === 1 && /\p{L}/u.test(bare)) return false;
  if (/^\p{N}+$/u.test(bare) && nextToken) return false;
  return !ABBREVIATIONS.has(bare);
}

function countWords(text: string): number {
  return text.split(/[\s]+/).filter((token) => LETTER_OR_DIGIT.test(token)).length;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}
