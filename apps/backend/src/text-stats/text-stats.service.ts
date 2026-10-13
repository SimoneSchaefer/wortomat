import { Injectable } from '@nestjs/common';
import type { QuoteStyle, TextStatsResponse, WordCount } from '@wortomat/shared';
import { ProjectService } from '../project/project.service.js';
import { AppSettingsService } from '../settings/app-settings.service.js';
import { analyzeText, type QuotePair } from './analyze.js';

const TOP_WORDS = 15;

/**
 * Wörtliche Rede je Stil – nur das jeweils erste bzw. letzte Zeichen (beim französischen Stil
 * gehören schmale Leerzeichen dazu). Ohne Ersetzen tippt man meist gerade Anführungszeichen.
 */
const QUOTES: Record<QuoteStyle, QuotePair> = {
  de: { open: '„', close: '“' },
  'de-guillemets': { open: '»', close: '«' },
  ch: { open: '«', close: '»' },
  en: { open: '“', close: '”' },
  fr: { open: '«', close: '»' },
  off: { open: '"', close: '"' },
};

@Injectable()
export class TextStatsService {
  constructor(
    private readonly projects: ProjectService,
    private readonly settings: AppSettingsService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  /** Wertet den Text aller Szenen aus (aus dem Suchindex, dort steht er als reiner Text). */
  stats(): TextStatsResponse {
    const quotes = QUOTES[this.settings.get().quoteStyle];
    const rows = this.db
      .prepare(
        `SELECT f.node_id AS id, f.body AS body
           FROM scene_fts f JOIN nodes n ON n.id = f.node_id
          WHERE n.kind = 'scene'`,
      )
      .all() as { id: string; body: string }[];

    const fillers = new Map<string, number>();
    const wordCounts = new Map<string, number>();
    const wordForms = new Map<string, Map<string, number>>();
    let words = 0;
    const scenes = rows.map(({ id, body }) => {
      const stats = analyzeText(body, quotes);
      words += stats.words;
      merge(fillers, stats.fillers);
      merge(wordCounts, stats.wordCounts);
      for (const [word, forms] of stats.wordForms) {
        let merged = wordForms.get(word);
        if (!merged) wordForms.set(word, (merged = new Map()));
        merge(merged, forms);
      }
      return {
        sceneId: id,
        words: stats.words,
        dialogueWords: stats.dialogueWords,
        sentences: stats.sentences,
      };
    });

    // Namen von Figuren und Orten wären sonst ganz oben – sie sind keine „Lieblingswörter“.
    const names = this.db
      .prepare(`SELECT title FROM notes WHERE kind IN ('character', 'place')`)
      .all() as { title: string }[];
    for (const { title } of names) {
      for (const part of title.toLowerCase().split(/[^\p{L}\p{N}]+/u)) wordCounts.delete(part);
    }

    return {
      scenes,
      fillers: ranked(fillers),
      // in der häufigsten Schreibweise: „Blick“, aber „ging“
      // erst ab zwei Vorkommen – einmalige Wörter sind kein Muster
      topWords: ranked(wordCounts)
        .filter(({ count }) => count > 1)
        .slice(0, TOP_WORDS)
        .map(({ word, count }) => ({ word: commonForm(wordForms.get(word)) ?? word, count })),
      words,
    };
  }
}

function merge(into: Map<string, number>, from: ReadonlyMap<string, number>): void {
  for (const [key, count] of from) into.set(key, (into.get(key) ?? 0) + count);
}

/** Häufigste zuerst, bei Gleichstand alphabetisch. */
function ranked(counts: ReadonlyMap<string, number>): WordCount[] {
  return [...counts]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'de'));
}

function commonForm(forms: ReadonlyMap<string, number> | undefined): string | undefined {
  let best: string | undefined;
  let bestCount = 0;
  for (const [form, count] of forms ?? []) {
    if (count > bestCount) [best, bestCount] = [form, count];
  }
  return best;
}
