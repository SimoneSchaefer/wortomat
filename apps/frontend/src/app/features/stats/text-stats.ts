import { Component, computed, inject, resource } from '@angular/core';
import { AppSettingsStore } from '../../core/app-settings';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { SearchRequest } from '../../core/search-request';
import { analyzeBook, quotePair } from '../../core/text-analysis';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';
import { chapterText } from './stats';

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
  private readonly settings = inject(AppSettingsStore);
  private readonly notes = inject(NotesStore);

  private readonly texts = resource({ loader: () => this.api.sceneTexts() });
  /** Names of characters and places are no favourite words. */
  private readonly names = computed(() =>
    this.notes
      .notes()
      .filter((note) => note.kind === 'character' || note.kind === 'place')
      .map((note) => note.title),
  );
  private readonly stats = computed(() => {
    const texts = this.texts.value();
    if (!texts) return null;
    return analyzeBook(texts, quotePair(this.settings.settings().quoteStyle), this.names());
  });

  protected readonly data = computed(() => {
    const stats = this.stats();
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
      /** Longest average sentence length – the scale of the bars. */
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
