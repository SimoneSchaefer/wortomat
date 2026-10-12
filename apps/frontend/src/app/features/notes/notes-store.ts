import { inject, Injectable, signal } from '@angular/core';
import type { NoteKind, NoteSummary, UpdateNoteRequest } from '@wortomat/shared';
import { WortomatApi } from '../../core/wortomat-api';

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/**
 * Charaktere, Orte und Recherchen des geöffneten Projekts.
 * Wird im Arbeitsbereich bereitgestellt und daher bei jedem Projektwechsel neu angelegt.
 */
@Injectable()
export class NotesStore {
  private readonly api = inject(WortomatApi);

  readonly notes = signal<NoteSummary[]>([]);
  readonly loaded = signal(false);

  async load(): Promise<void> {
    this.notes.set(await this.api.listNotes());
    this.loaded.set(true);
  }

  /** Alphabetisch sortiert („Ärztin“ bei A, „Kapitel 10“ nach „Kapitel 9“). */
  byKind(kind: NoteKind): NoteSummary[] {
    return this.notes()
      .filter((note) => note.kind === kind)
      .sort((a, b) => collator.compare(a.title, b.title));
  }

  find(id: string): NoteSummary | undefined {
    return this.notes().find((note) => note.id === id);
  }

  async create(kind: NoteKind, title: string): Promise<NoteSummary> {
    const note = await this.api.createNote({ kind, title });
    this.notes.update((notes) => [...notes, note]);
    return note;
  }

  async update(id: string, request: UpdateNoteRequest): Promise<void> {
    const updated = await this.api.updateNote(id, request);
    this.notes.update((notes) => notes.map((note) => (note.id === id ? updated : note)));
  }

  async remove(id: string): Promise<void> {
    await this.api.deleteNote(id);
    this.notes.update((notes) => notes.filter((note) => note.id !== id));
  }
}
