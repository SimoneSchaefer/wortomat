import { Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { NoteSummary, SceneStatus } from '@wortomat/shared';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { SCENE_STATUSES, statusInfo } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { WortomatApi } from '../../core/wortomat-api';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KINDS } from '../notes/note-kinds';
import { NotesStore } from '../notes/notes-store';
import { TextStats } from './text-stats';
import { WritingCalendar } from './writing-calendar';
import {
  chapterStats,
  presence,
  scenesInOrder,
  statusTotals,
  WORDS_PER_PAGE,
  type SceneEntry,
} from './stats';

type Unit = 'words' | 'scenes';
type PresenceKind = 'character' | 'place';

interface Tooltip {
  text: string;
  x: number;
  y: number;
  /** Near the window edge the tooltip sits beside instead of centred above the element. */
  align: 'center' | 'start' | 'end';
}

/** This close to the window edge the tooltip is aligned to the side (about half its width). */
const TOOLTIP_EDGE_PX = 180;

@Component({
  selector: 'wm-stats-page',
  imports: [RouterLink, StatusIcon, NoteAvatar, TextStats, WritingCalendar],
  templateUrl: './stats-page.html',
  styleUrl: './stats-page.scss',
  host: {
    '(pointerover)': 'showTip($event)',
    '(pointerout)': 'hideTip($event)',
    '(focusin)': 'showTip($event)',
    '(focusout)': 'hideTip($event)',
  },
})
export class StatsPage {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly notes = inject(NotesStore);
  private readonly api = inject(WortomatApi);

  protected readonly statuses = SCENE_STATUSES;
  protected readonly statusInfo = statusInfo;

  protected readonly scenes = computed(() => scenesInOrder(this.store.tree()));
  protected readonly chapters = computed(() => chapterStats(this.store.tree()));
  protected readonly totals = computed(() => statusTotals(this.scenes()));
  protected readonly totalWords = computed(() => this.store.totalWords());
  protected readonly pages = computed(() => Math.round(this.totalWords() / WORDS_PER_PAGE));
  /** Share of final in all words in percent; `null` without words. */
  protected readonly finalShare = computed(() => {
    const total = this.totalWords();
    const final = this.totals().find((entry) => entry.status === 'final')!.words;
    return total ? Math.round((final / total) * 100) : null;
  });

  /** Without written words, progress is measured in scenes – otherwise the bar would be empty. */
  private readonly chosenUnit = signal<Unit>('words');
  protected readonly unit = computed<Unit>(() =>
    this.totalWords() ? this.chosenUnit() : 'scenes',
  );
  protected readonly progress = computed(() => {
    const unit = this.unit();
    const segments = this.totals().map((entry) => ({ ...entry, value: entry[unit] }));
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    return { segments: segments.filter((segment) => segment.value > 0), total };
  });

  protected readonly maxChapterWords = computed(() =>
    Math.max(1, ...this.chapters().map((chapter) => chapter.words)),
  );

  protected readonly presenceKinds: readonly PresenceKind[] = ['character', 'place'];
  protected readonly presenceKind = signal<PresenceKind>('character');
  private readonly relations = resource({ loader: () => this.api.sceneRelations() });
  protected readonly presence = computed(() => {
    const relations = this.relations.value();
    if (!relations) return null;
    const kind = this.presenceKind();
    const notes = this.notes.notes().filter((note) => note.kind === kind);
    return { ...presence(this.scenes(), notes, relations), total: notes.length };
  });
  protected readonly chapterColumns = computed(() => {
    const columns: { entry: SceneEntry; span: number }[] = [];
    for (const entry of this.scenes()) {
      const last = columns.at(-1);
      if (last?.entry.chapter.id === entry.chapter.id) last.span++;
      else columns.push({ entry, span: 1 });
    }
    return columns;
  });

  protected readonly tip = signal<Tooltip | null>(null);

  protected notePath(note: NoteSummary): string[] {
    return ['/write', NOTE_KINDS[note.kind].path, note.id];
  }

  protected setUnit(unit: Unit): void {
    this.chosenUnit.set(unit);
  }

  protected statusName(status: SceneStatus): string {
    return this.t().sceneStatus.names[status];
  }

  /** "Draft: 1,234 words · 3 scenes" */
  protected statusTip(status: SceneStatus, words: number, scenes: number): string {
    const t = this.t();
    return `${this.statusName(status)}: ${t.words(words)} · ${t.stats.scenes(scenes)}`;
  }

  protected isChapterStart(index: number): boolean {
    const scenes = this.scenes();
    return index > 0 && scenes[index]!.chapter.id !== scenes[index - 1]!.chapter.id;
  }

  // Tooltip: one shared by all elements with `data-tip` (mouse and keyboard)

  protected showTip(event: Event): void {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-tip]');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const align =
      x > window.innerWidth - TOOLTIP_EDGE_PX ? 'end' : x < TOOLTIP_EDGE_PX ? 'start' : 'center';
    const left = align === 'end' ? rect.right : align === 'start' ? rect.left : x;
    this.tip.set({ text: target.dataset['tip']!, x: left, y: rect.top, align });
  }

  protected hideTip(event: Event): void {
    const target = (event.target as Element | null)?.closest('[data-tip]');
    const next = (event as FocusEvent | PointerEvent).relatedTarget as Node | null;
    if (target && next && target.contains(next)) return;
    this.tip.set(null);
  }
}
