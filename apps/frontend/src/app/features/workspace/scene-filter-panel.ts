import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ANNOTATION_KINDS } from '../../core/annotations';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { SCENE_STATUSES } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KIND_LIST } from '../notes/note-kinds';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from './scene-filter';

/**
 * Filter über dem Manuskript-Baum: ein Knopf, der ein Popover öffnet – darin je Zeile
 * Status, offene Markierungen, Charaktere, Orte und Tags zum An- und Abwählen.
 * Daneben, solange gefiltert wird: „3 von 12 Szenen“ und „Zurücksetzen“.
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
  protected readonly error = signal<string | null>(null);

  /** Je verknüpfbarer Art (Charaktere, Orte) die Einträge, die in Szenen vorkommen. */
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
      await this.filter.load(); // könnte sich seit dem letzten Öffnen geändert haben
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  /** @param refocus bei Escape: Fokus zurück auf den Filter-Knopf */
  protected close(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.toggleButton().nativeElement.focus();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
