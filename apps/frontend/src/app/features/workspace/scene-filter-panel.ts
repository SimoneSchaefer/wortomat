import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ANNOTATION_KINDS } from '../../core/annotations';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { SCENE_STATUSES } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { strandColor } from '../../core/strands';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KIND_LIST } from '../notes/note-kinds';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from './scene-filter';
import { StatusMessages } from '../../core/status-messages';

/**
 * A button above the manuscript tree that opens a popover with one row each for status, open marks,
 * turning points, threads, characters, places and tags to toggle. Next to it, while filtering: "3
 * of 12 scenes" and "Reset".
 */
@Component({
  selector: 'wm-scene-filter-panel',
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(keydown.escape)': 'close(true)',
  },
  imports: [StatusIcon, NoteAvatar],
  templateUrl: './scene-filter-panel.html',
  styleUrl: './scene-filter-panel.scss',
})
export class SceneFilterPanel {
  protected readonly filter = inject(SceneFilter);
  private readonly notes = inject(NotesStore);
  protected readonly t = inject(I18n).t;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toggleButton = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');

  protected readonly open = signal(false);

  protected readonly statuses = SCENE_STATUSES;
  protected readonly annotationKinds = ANNOTATION_KINDS;
  protected readonly strandColor = strandColor;
  private readonly error = inject(StatusMessages).channel();

  /** Per linkable kind (characters, places), the entries that appear in scenes. */
  protected readonly noteGroups = computed(() => {
    const linked = this.filter.linkedNoteIds();
    return NOTE_KIND_LIST.filter((config) => config.linkable)
      .map((config) => ({
        kind: config.kind,
        notes: this.notes.byKind(config.kind).filter((note) => linked.has(note.id)),
      }))
      .filter((group) => group.notes.length > 0);
  });

  protected async toggleOpen(): Promise<void> {
    if (this.open()) {
      this.close();
      return;
    }
    this.error.set(null);
    this.open.set(true);
    try {
      await this.filter.load(); // may have changed since the last opening
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  /** @param refocus on Escape: focus back on the filter button */
  protected close(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.toggleButton().nativeElement.focus();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
