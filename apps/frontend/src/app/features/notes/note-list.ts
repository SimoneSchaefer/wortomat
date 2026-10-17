import { Component, computed, inject, input, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { AnnotationCounts, NoteGroup, NoteKind, NoteSummary } from '@wortomat/shared';
import { AnnotationBadges } from '../../core/annotation-badges';
import { addCounts, ANNOTATION_KINDS, NO_ANNOTATIONS } from '../../core/annotations';
import { Autofocus } from '../../core/autofocus';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { NoteAvatar } from './note-avatar';
import { NOTE_KINDS } from './note-kinds';
import { NotesStore } from './notes-store';
import { StatusMessages } from '../../core/status-messages';
import { ConfirmDialog } from '../../core/confirm-dialog';

const DRAG_TYPE = 'application/x-wortomat-note';
const GROUP_DRAG_TYPE = 'application/x-wortomat-note-group';

/** Where a dragged group would land: before or after the section (`''` = "No group"). */
interface GroupDrop {
  targetId: string;
  position: 'before' | 'after';
}

/** Sidebar for characters, places or research. */
@Component({
  selector: 'wm-note-list',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    AnnotationBadges,
    Autofocus,
    NoteAvatar,
  ],
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
  /** Headings only once there is at least one group. */
  protected readonly showGroups = computed(() => this.groups().some((entry) => entry.group));
  /**
   * Mark kinds occurring in this list – with a fixed slot in every row so the counts line up (as in
   * the manuscript tree).
   */
  protected readonly annotationKinds = computed(() => {
    const total = this.groups()
      .flatMap((entry) => entry.notes)
      .reduce((sum, note) => addCounts(sum, note.annotations), NO_ANNOTATIONS);
    return ANNOTATION_KINDS.filter((info) => total[info.kind] > 0);
  });
  protected readonly editingGroupId = signal<string | null>(null);
  private readonly error = inject(StatusMessages).channel();
  private readonly confirm = inject(ConfirmDialog);

  protected readonly draggingId = signal<string | null>(null);
  /** Group a note is currently hovering over (`''` = no group). */
  protected readonly dropGroupId = signal<string | null>(null);

  protected readonly draggingGroupId = signal<string | null>(null);
  protected readonly groupDrop = signal<GroupDrop | null>(null);

  /** Called from the sidebar header – or with a group from its "+". */
  async add(groupId: string | null = null): Promise<void> {
    await this.run(async () => {
      const note = await this.store.create(this.kind(), this.texts().newTitle);
      if (groupId) {
        await this.store.update(note.id, { groupId });
        if (this.store.isGroupCollapsed(groupId)) this.store.toggleGroup(groupId); // make it visible
      }
      await this.router.navigate(['/write', this.config().path, note.id]);
    });
  }

  /** From the header: create a new group and edit its name right away. */
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
    const confirmed = await this.confirm.ask({
      title: this.t().notes.deleteGroupTitle,
      message: this.texts().deleteGroupMessage(group.name),
      confirmLabel: this.t().confirm.delete,
    });
    if (!confirmed) return;
    await this.run(() => this.store.removeGroup(group.id));
  }

  protected isCollapsed(groupId: string | null): boolean {
    return this.store.isGroupCollapsed(groupId ?? '');
  }

  /** Group total – only when collapsed; expanded, the counts sit on the notes. */
  protected groupAnnotations(groupId: string | null, notes: NoteSummary[]): AnnotationCounts {
    return this.isCollapsed(groupId)
      ? notes.reduce((sum, note) => addCounts(sum, note.annotations), NO_ANNOTATIONS)
      : NO_ANNOTATIONS;
  }

  protected toggle(groupId: string | null): void {
    this.store.toggleGroup(groupId ?? '');
  }

  protected onDragStart(event: DragEvent, note: NoteSummary): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_TYPE, note.id);
    this.draggingId.set(note.id);
  }

  protected onDragOver(event: DragEvent, groupId: string | null): void {
    if (this.draggingGroupId()) {
      this.onGroupDragOver(event, groupId);
      return;
    }
    if (!this.draggingId() || !event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    this.dropGroupId.set(groupId ?? '');
  }

  protected onDragLeave(event: DragEvent, groupId: string | null): void {
    const target = event.currentTarget as HTMLElement;
    if (
      this.groupDrop()?.targetId === (groupId ?? '') &&
      !target.contains(event.relatedTarget as Node | null)
    ) {
      this.groupDrop.set(null);
    }
    if (
      this.dropGroupId() === (groupId ?? '') &&
      !target.contains(event.relatedTarget as Node | null)
    ) {
      this.dropGroupId.set(null);
    }
  }

  protected async onDrop(event: DragEvent, groupId: string | null): Promise<void> {
    event.preventDefault();
    if (this.draggingGroupId()) {
      await this.onGroupDrop();
      return;
    }
    const id = event.dataTransfer?.getData(DRAG_TYPE);
    this.dropGroupId.set(null);
    this.draggingId.set(null);
    const note = id ? this.store.find(id) : undefined;
    if (!note || (this.store.findGroup(note.groupId)?.id ?? null) === groupId) return;
    await this.run(() => this.store.update(note.id, { groupId }));
  }

  protected onGroupDragStart(event: DragEvent, groupId: string | null): void {
    if (!groupId || !event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(GROUP_DRAG_TYPE, groupId);
    this.draggingGroupId.set(groupId);
  }

  protected onGroupDragEnd(): void {
    this.draggingGroupId.set(null);
    this.groupDrop.set(null);
  }

  /**
   * Upper half of the section: before, lower half: after. "No group" always stays at the bottom.
   */
  private onGroupDragOver(event: DragEvent, groupId: string | null): void {
    if (!event.dataTransfer?.types.includes(GROUP_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const upperHalf = event.clientY < rect.top + rect.height / 2;
    const position = groupId !== null && upperHalf ? 'before' : 'after';
    // After the last group = before "No group": show it as a line at the top there
    this.groupDrop.set(
      groupId === null ? { targetId: '', position: 'before' } : { targetId: groupId, position },
    );
  }

  private async onGroupDrop(): Promise<void> {
    const id = this.draggingGroupId();
    const drop = this.groupDrop();
    this.onGroupDragEnd();
    if (!id || !drop) return;
    const order = this.store.groupsOfKind(this.kind()).map((group) => group.id);
    let beforeId: string | null;
    if (drop.targetId === '') {
      beforeId = null;
    } else if (drop.position === 'before') {
      beforeId = drop.targetId;
    } else {
      beforeId = order[order.indexOf(drop.targetId) + 1] ?? null;
    }
    // Already in this place? Then do nothing.
    if (beforeId === id || (order[order.indexOf(id) + 1] ?? null) === beforeId) return;
    await this.run(() => this.store.moveGroup(id, beforeId));
  }

  protected async remove(note: NoteSummary): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.t().notes.deleteTitle(this.texts().singular),
      message: this.t().notes.deleteMessage(note.title),
      confirmLabel: this.t().tree.moveToTrash,
    });
    if (!confirmed) return;
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
