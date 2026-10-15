import { inject, Injectable, signal } from '@angular/core';
import type {
  AnnotationCounts,
  ImageCrop,
  NoteGroup,
  NoteKind,
  NoteSummary,
  UpdateNoteRequest,
} from '@wortomat/shared';
import { WortomatApi } from '../../core/wortomat-api';

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true });

/** `group` is `null` for "no group". */
export interface GroupedNotes {
  group: NoteGroup | null;
  notes: NoteSummary[];
}

/** Provided in the workspace and therefore created anew on every project switch. */
@Injectable()
export class NotesStore {
  private readonly api = inject(WortomatApi);

  readonly notes = signal<NoteSummary[]>([]);
  readonly groups = signal<NoteGroup[]>([]);
  readonly loaded = signal(false);
  readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());

  async load(): Promise<void> {
    const [notes, groups] = await Promise.all([this.api.listNotes(), this.api.listNoteGroups()]);
    this.notes.set(notes);
    this.groups.set(groups);
    this.loaded.set(true);
  }

  /** Alphabetical ("Ärztin" under A, "Kapitel 10" after "Kapitel 9"). */
  byKind(kind: NoteKind): NoteSummary[] {
    return this.notes()
      .filter((note) => note.kind === kind)
      .sort((a, b) => collator.compare(a.title, b.title));
  }

  /** In their order (as the backend delivers them, new ones last). */
  groupsOfKind(kind: NoteKind): NoteGroup[] {
    return this.groups().filter((group) => group.kind === kind);
  }

  findGroup(id: string | null): NoteGroup | undefined {
    return id === null ? undefined : this.groups().find((group) => group.id === id);
  }

  /** All groups (empty ones too), followed by the notes without a group – if there are any. */
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

  /** After changes to the gallery: update the profile picture in the list. */
  setCover(id: string, coverImageUrl: string | null, coverCrop: ImageCrop | null): void {
    this.notes.update((notes) =>
      notes.map((note) => (note.id === id ? { ...note, coverImageUrl, coverCrop } : note)),
    );
  }

  /** After saving the text: update the todo/idea/fixme counts in the list. */
  setAnnotations(id: string, annotations: AnnotationCounts): void {
    this.notes.update((notes) =>
      notes.map((note) => (note.id === id ? { ...note, annotations } : note)),
    );
  }

  async remove(id: string): Promise<void> {
    await this.api.deleteNote(id);
    this.notes.update((notes) => notes.filter((note) => note.id !== id));
  }

  async createGroup(kind: NoteKind, name: string): Promise<NoteGroup> {
    const group = await this.api.createNoteGroup({ kind, name });
    this.groups.update((groups) => [...groups, group]);
    return group;
  }

  async renameGroup(id: string, name: string): Promise<void> {
    const updated = await this.api.updateNoteGroup(id, { name });
    this.groups.update((groups) => groups.map((group) => (group.id === id ? updated : group)));
  }

  /** `null` = at the end. */
  async moveGroup(id: string, beforeId: string | null): Promise<void> {
    this.groups.set(await this.api.moveNoteGroup(id, { beforeId }));
  }

  /** The group's notes are kept and end up without a group. */
  async removeGroup(id: string): Promise<void> {
    await this.api.deleteNoteGroup(id);
    this.groups.update((groups) => groups.filter((group) => group.id !== id));
    this.notes.update((notes) =>
      notes.map((note) => (note.groupId === id ? { ...note, groupId: null } : note)),
    );
  }
}
