import { Component, computed, inject, resource } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { SearchRequest } from '../../core/search-request';
import { WortomatApi } from '../../core/wortomat-api';
import { chapterText } from './stats';

/**
 * Text: Dialoganteil und Satzlänge je Kapitel, Füll- und Lieblingswörter des Buchs.
 * Die Tooltips (`data-tip`) zeigt die Statistikseite drumherum.
 */
@Component({
  selector: 'wm-text-stats',
  templateUrl: './text-stats.html',
  styleUrl: './text-stats.scss',
})
export class TextStats {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly api = inject(WortomatApi);
  private readonly search = inject(SearchRequest);

  private readonly stats = resource({ loader: () => this.api.textStats() });

  protected readonly data = computed(() => {
    const stats = this.stats.value();
    if (!stats) return null;
    const chapters = chapterText(this.store.tree(), stats.scenes).map((chapter) => ({
      ...chapter,
      dialogue: chapter.words ? (chapter.dialogueWords / chapter.words) * 100 : null,
      sentenceLength: chapter.sentences ? chapter.words / chapter.sentences : null,
    }));
    const dialogueWords = stats.scenes.reduce((sum, scene) => sum + scene.dialogueWords, 0);
    const sentences = stats.scenes.reduce((sum, scene) => sum + scene.sentences, 0);
    const fillers = stats.fillers.reduce((sum, filler) => sum + filler.count, 0);
    return {
      ...stats,
      chapters,
      dialogue: stats.words ? (dialogueWords / stats.words) * 100 : 0,
      sentenceLength: sentences ? stats.words / sentences : 0,
      fillersPer1000: stats.words ? (fillers / stats.words) * 1000 : 0,
      /** Längste Durchschnittssatzlänge – Maßstab der Balken. */
      maxSentenceLength: Math.max(1, ...chapters.map((chapter) => chapter.sentenceLength ?? 0)),
    };
  });

  protected chapterName(number: number, title: string): string {
    return this.t().stats.chapterTip(number, title);
  }

  protected searchFor(word: string): void {
    this.search.search(word);
  }
}
