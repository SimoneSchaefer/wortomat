import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import type { NoteGroup, NoteKind } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { filterCandidates, hasExactTitle } from './note-matching';
import { NotesStore } from './notes-store';
import { StatusMessages } from '../../core/status-messages';

/** Eintrag in der Auswahlliste: vorhandene Gruppe oder neue anlegen. */
type Option = { type: 'group'; group: NoteGroup; count: number } | { type: 'create'; name: string };

/**
 * Gruppe einer Notiz (z. B. „Familie Berger“) – als Chip mit derselben Auswahl wie die
 * Verknüpfungen einer Szene: suchen, vorhandene Gruppe wählen oder neue anlegen.
 */
@Component({
  selector: 'wm-note-group-picker',
  imports: [Autofocus],
  templateUrl: './note-group-picker.html',
  styleUrl: './note-group-picker.scss',
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class NoteGroupPicker {
  readonly noteId = input.required<string>();
  readonly kind = input.required<NoteKind>();

  protected readonly t = inject(I18n).t;
  private readonly store = inject(NotesStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly group = computed(() =>
    this.store.findGroup(this.store.find(this.noteId())?.groupId ?? null),
  );
  private readonly error = inject(StatusMessages).channel();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly options = computed<Option[]>(() => {
    const term = this.query().trim();
    const kind = this.kind();
    const groups = this.store.groupsOfKind(kind).map((group) => ({
      id: group.id,
      title: group.name,
      group,
      count: this.store.notes().filter((note) => note.groupId === group.id).length,
    }));
    const current = new Set(this.group() ? [this.group()!.id] : []);
    const options: Option[] = filterCandidates(groups, current, term).map((item) => ({
      type: 'group',
      group: item.group,
      count: item.count,
    }));
    if (term && !hasExactTitle(groups, term)) {
      options.push({ type: 'create', name: term });
    }
    return options;
  });

  protected readonly emptyHint = computed(() =>
    this.group() ? this.t().notes.noOtherGroups : this.t().notes.noGroups,
  );

  protected toggle(): void {
    this.open.update((open) => !open);
    this.query.set('');
    this.activeIndex.set(0);
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex.set(count ? (this.activeIndex() + 1) % count : 0);
        break;
      case 'ArrowUp':
        this.activeIndex.set(count ? (this.activeIndex() - 1 + count) % count : 0);
        break;
      case 'Enter': {
        const option = this.options()[this.activeIndex()];
        if (option) void this.choose(option);
        break;
      }
      case 'Escape':
        this.open.set(false);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected async choose(option: Option): Promise<void> {
    this.open.set(false);
    await this.run(async () => {
      const group =
        option.type === 'group'
          ? option.group
          : await this.store.createGroup(this.kind(), option.name);
      await this.store.update(this.noteId(), { groupId: group.id });
    });
  }

  protected async removeFromGroup(): Promise<void> {
    await this.run(() => this.store.update(this.noteId(), { groupId: null }));
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
