import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { NoteKind, NoteSummary } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { NOTE_KINDS } from './note-kinds';
import { NotesStore } from './notes-store';

/** Seitenleiste für Charaktere, Orte oder Recherchen. */
@Component({
  selector: 'wm-note-list',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './note-list.html',
  styleUrl: './note-list.scss',
})
export class NoteList {
  readonly kind = input.required<NoteKind>();

  private readonly store = inject(NotesStore);
  private readonly router = inject(Router);

  protected readonly config = computed(() => NOTE_KINDS[this.kind()]);
  protected readonly notes = computed(() => this.store.byKind(this.kind()));
  protected readonly error = signal<string | null>(null);

  protected async add(): Promise<void> {
    this.error.set(null);
    try {
      const note = await this.store.create(this.kind(), this.config().newTitle);
      await this.router.navigate(['/write', this.config().path, note.id]);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  protected async remove(note: NoteSummary): Promise<void> {
    if (!confirm(`„${note.title}“ wirklich löschen?`)) return;
    this.error.set(null);
    try {
      await this.store.remove(note.id);
      if (this.router.url.endsWith(`/${note.id}`)) {
        await this.router.navigate(['/write', this.config().path]);
      }
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
