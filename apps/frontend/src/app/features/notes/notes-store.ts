import { inject, Injectable, signal } from '@angular/core';
import type { NoteGroup, NoteKind, NoteSummary, UpdateNoteRequest } from '@wortomat/shared';
import { WortomatApi } from '../../core/wortomat-api';

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/** Eine Gruppe mit ihren Notizen; `group` ist `null` für „ohne Gruppe“. */
export interface GroupedNotes {
  group: NoteGroup | null;
  notes: NoteSummary[];
}

/**
 * Charaktere, Orte und Recherchen des geöffneten Projekts.
 * Wird im Arbeitsbereich bereitgestellt und daher bei jedem Projektwechsel neu angelegt.
 */
@Injectable()
export class NotesStore {
  private readonly api = inject(WortomatApi);

  readonly notes = signal<NoteSummary[]>([]);
  readonly groups = signal<NoteGroup[]>([]);
  readonly loaded = signal(false);
  /** Eingeklappte Gruppen in der Seitenleiste (Gruppen-IDs). */
  readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());

  async load(): Promise<void> {
    const [notes, groups] = await Promise.all([this.api.listNotes(), this.api.listNoteGroups()]);
    this.notes.set(notes);
    this.groups.set(groups);
    this.loaded.set(true);
  }

  /** Alphabetisch sortiert („Ärztin“ bei A, „Kapitel 10“ nach „Kapitel 9“). */
  byKind(kind: NoteKind): NoteSummary[] {
    return this.notes()
      .filter((note) => note.kind === kind)
      .sort((a, b) => collator.compare(a.title, b.title));
  }

  /** Gruppen einer Art, alphabetisch. */
  groupsOfKind(kind: NoteKind): NoteGroup[] {
    return this.groups()
      .filter((group) => group.kind === kind)
      .sort((a, b) => collator.compare(a.name, b.name));
  }

  findGroup(id: string | null): NoteGroup | undefined {
    return id === null ? undefined : this.groups().find((group) => group.id === id);
  }

  /** Alle Gruppen (auch leere), dahinter die Notizen ohne Gruppe – sofern es welche gibt. */
  groupedByKind(kind: NoteKind): GroupedNotes[] {
    const notes = this.byKind(kind);
    const grouped: GroupedNotes[] = this.groupsOfKind(kind).map((group) => ({
      group,
      notes: notes.filter((note) => note.groupId === group.id),
    }));
    const ungrouped = notes.filter((note) => !this.findGroup(note.groupId));
    return ungrouped.length ? [...grouped, { group: null, notes: ungrouped }] : grouped;
  }

  isGroupCollapsed(id: string): boolean {
    return this.collapsedGroups().has(id);
  }

  toggleGroup(id: string): void {
    this.collapsedGroups.update((collapsed) => {
      const next = new Set(collapsed);
      if (!next.delete(id)) next.add(id);
      return next;
    });
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

  /** Nach Änderungen an der Galerie: Profilbild in der Liste aktualisieren. */
  setCover(id: string, coverImageUrl: string | null): void {
    this.notes.update((notes) =>
      notes.map((note) => (note.id === id ? { ...note, coverImageUrl } : note)),
    );
  }

  async remove(id: string): Promise<void> {
    await this.api.deleteNote(id);
    this.notes.update((notes) => notes.filter((note) => note.id !== id));
  }

  // Gruppen --------------------------------------------------------------------

  async createGroup(kind: NoteKind, name: string): Promise<NoteGroup> {
    const group = await this.api.createNoteGroup({ kind, name });
    this.groups.update((groups) => [...groups, group]);
    return group;
  }

  async renameGroup(id: string, name: string): Promise<void> {
    const updated = await this.api.updateNoteGroup(id, { name });
    this.groups.update((groups) => groups.map((group) => (group.id === id ? updated : group)));
  }

  /** Die Notizen der Gruppe bleiben erhalten und stehen danach ohne Gruppe da. */
  async removeGroup(id: string): Promise<void> {
    await this.api.deleteNoteGroup(id);
    this.groups.update((groups) => groups.filter((group) => group.id !== id));
    this.notes.update((notes) =>
      notes.map((note) => (note.groupId === id ? { ...note, groupId: null } : note)),
    );
  }
}
