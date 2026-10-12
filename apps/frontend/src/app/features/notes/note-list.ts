import { Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { NoteGroup, NoteKind, NoteSummary } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { NoteAvatar } from './note-avatar';
import { NOTE_KINDS } from './note-kinds';
import { NotesStore } from './notes-store';

const DRAG_TYPE = 'application/x-wortomat-note';

/** Seitenleiste für Charaktere, Orte oder Recherchen. */
@Component({
  selector: 'wm-note-list',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, Autofocus, NoteAvatar],
  templateUrl: './note-list.html',
  styleUrl: './note-list.scss',
})
export class NoteList {
  readonly kind = input.required<NoteKind>();

  protected readonly t = inject(I18n).t;
  private readonly store = inject(NotesStore);
  private readonly router = inject(Router);

  protected readonly config = computed(() => NOTE_KINDS[this.kind()]);
  protected readonly texts = computed(() => this.t().noteKinds[this.kind()]);
  protected readonly groups = computed(() => this.store.groupedByKind(this.kind()));
  /** Überschriften erst, sobald es mindestens eine Gruppe gibt. */
  protected readonly showGroups = computed(() => this.groups().some((entry) => entry.group));
  /** Gruppe, deren Name gerade bearbeitet wird. */
  protected readonly editingGroupId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly draggingId = signal<string | null>(null);
  /** Gruppe, über der gerade eine Notiz schwebt (`''` = ohne Gruppe). */
  protected readonly dropGroupId = signal<string | null>(null);

  /** Von der Kopfzeile der Seitenleiste aus aufgerufen – oder mit Gruppe über deren „+“. */
  async add(groupId: string | null = null): Promise<void> {
    await this.run(async () => {
      const note = await this.store.create(this.kind(), this.texts().newTitle);
      if (groupId) {
        await this.store.update(note.id, { groupId });
        if (this.store.isGroupCollapsed(groupId)) this.store.toggleGroup(groupId); // sichtbar machen
      }
      await this.router.navigate(['/write', this.config().path, note.id]);
    });
  }

  /** Von der Kopfzeile aus: neue Gruppe anlegen und gleich den Namen bearbeiten. */
  async addGroup(): Promise<void> {
    await this.run(async () => {
      const group = await this.store.createGroup(this.kind(), this.t().notes.newGroup);
      this.editingGroupId.set(group.id);
    });
  }

  protected async renameGroup(group: NoteGroup, name: string): Promise<void> {
    if (this.editingGroupId() !== group.id) return;
    this.editingGroupId.set(null);
    const trimmed = name.trim();
    if (trimmed && trimmed !== group.name) {
      await this.run(() => this.store.renameGroup(group.id, trimmed));
    }
  }

  protected async removeGroup(group: NoteGroup): Promise<void> {
    if (!confirm(this.texts().confirmDeleteGroup(group.name))) return;
    await this.run(() => this.store.removeGroup(group.id));
  }

  protected isCollapsed(groupId: string | null): boolean {
    return this.store.isGroupCollapsed(groupId ?? '');
  }

  protected toggle(groupId: string | null): void {
    this.store.toggleGroup(groupId ?? '');
  }

  // Ziehen in eine andere Gruppe ---------------------------------------------

  protected onDragStart(event: DragEvent, note: NoteSummary): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_TYPE, note.id);
    this.draggingId.set(note.id);
  }

  protected onDragOver(event: DragEvent, groupId: string | null): void {
    if (!this.draggingId() || !event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    this.dropGroupId.set(groupId ?? '');
  }

  protected onDragLeave(event: DragEvent, groupId: string | null): void {
    const target = event.currentTarget as HTMLElement;
    if (
      this.dropGroupId() === (groupId ?? '') &&
      !target.contains(event.relatedTarget as Node | null)
    ) {
      this.dropGroupId.set(null);
    }
  }

  protected async onDrop(event: DragEvent, groupId: string | null): Promise<void> {
    event.preventDefault();
    const id = event.dataTransfer?.getData(DRAG_TYPE);
    this.dropGroupId.set(null);
    this.draggingId.set(null);
    const note = id ? this.store.find(id) : undefined;
    if (!note || (this.store.findGroup(note.groupId)?.id ?? null) === groupId) return;
    await this.run(() => this.store.update(note.id, { groupId }));
  }

  protected async remove(note: NoteSummary): Promise<void> {
    if (!confirm(this.t().notes.confirmDelete(note.title))) return;
    await this.run(async () => {
      await this.store.remove(note.id);
      if (this.router.url.endsWith(`/${note.id}`)) {
        await this.router.navigate(['/write', this.config().path]);
      }
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
