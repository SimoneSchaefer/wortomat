import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import type { NoteKind, NoteSummary } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { errorMessage } from '../../core/errors';
import { WortomatApi } from '../../core/wortomat-api';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KIND_LIST, NOTE_KINDS } from '../notes/note-kinds';
import { filterCandidates, hasExactTitle } from '../notes/note-matching';
import { NotesStore } from '../notes/notes-store';

const MAX_SUGGESTIONS = 8;

/** Eintrag in der Auswahlliste: vorhandene Notiz oder „neu anlegen“. */
type Option = { type: 'note'; note: NoteSummary } | { type: 'create'; title: string };

/** Leiste unter dem Szenentitel: welche Charaktere und Orte kommen in der Szene vor? */
@Component({
  selector: 'wm-scene-links',
  imports: [NoteAvatar, Autofocus],
  templateUrl: './scene-links.html',
  styleUrl: './scene-links.scss',
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class SceneLinks {
  readonly sceneId = input.required<string>();

  private readonly api = inject(WortomatApi);
  private readonly store = inject(NotesStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Nur IDs merken – Titel und Profilbild kommen aktuell aus dem NotesStore. */
  private readonly linkedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly error = signal<string | null>(null);

  protected readonly groups = computed(() =>
    NOTE_KIND_LIST.filter((config) => config.linkable).map((config) => ({
      config,
      notes: this.store.byKind(config.kind).filter((note) => this.linkedIds().has(note.id)),
    })),
  );

  // Auswahl (Popover) ---------------------------------------------------------
  protected readonly pickerKind = signal<NoteKind | null>(null);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  protected readonly options = computed<Option[]>(() => {
    const kind = this.pickerKind();
    if (!kind) return [];
    const all = this.store.byKind(kind);
    const options: Option[] = filterCandidates(all, this.linkedIds(), this.query())
      .slice(0, MAX_SUGGESTIONS)
      .map((note) => ({ type: 'note', note }));
    const title = this.query().trim();
    if (title && !hasExactTitle(all, title)) {
      options.push({ type: 'create', title });
    }
    return options;
  });

  /** Text, wenn die Auswahl leer ist (Neuanlage ist dann über die Eingabe möglich). */
  protected readonly emptyHint = computed(() => {
    const kind = this.pickerKind();
    if (!kind) return '';
    return this.store.byKind(kind).length
      ? 'Alle sind schon verknüpft – tippe einen Namen, um neu anzulegen.'
      : `Noch keine ${NOTE_KINDS[kind].label} – tippe einen Namen, um anzulegen.`;
  });

  private loadCounter = 0;

  constructor() {
    effect(() => {
      const sceneId = this.sceneId();
      untracked(() => {
        this.closePicker();
        void this.load(sceneId);
      });
    });
  }

  private async load(sceneId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    this.linkedIds.set(new Set());
    try {
      const notes = await this.api.sceneLinks(sceneId);
      if (loadId === this.loadCounter) this.setLinked(notes);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error));
    }
  }

  protected openPicker(kind: NoteKind): void {
    this.pickerKind.set(this.pickerKind() === kind ? null : kind);
    this.query.set('');
    this.activeIndex.set(0);
  }

  protected closePicker(): void {
    this.pickerKind.set(null);
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onPickerKeydown(event: KeyboardEvent): void {
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
        this.closePicker();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.pickerKind() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }

  protected async choose(option: Option): Promise<void> {
    const kind = this.pickerKind();
    const sceneId = this.sceneId();
    if (!kind) return;
    this.closePicker();
    await this.run(async () => {
      const note =
        option.type === 'note' ? option.note : await this.store.create(kind, option.title);
      this.setLinked(await this.api.linkNote(sceneId, note.id));
    });
  }

  protected async unlink(note: NoteSummary): Promise<void> {
    const sceneId = this.sceneId();
    await this.run(async () => this.setLinked(await this.api.unlinkNote(sceneId, note.id)));
  }

  protected open(note: NoteSummary): void {
    void this.router.navigate(['/write', NOTE_KINDS[note.kind].path, note.id]);
  }

  protected createLabel(title: string): string {
    const kind = this.pickerKind();
    return kind ? `„${title}“ als ${NOTE_KINDS[kind].newAccusative} anlegen` : '';
  }

  private setLinked(notes: NoteSummary[]): void {
    this.linkedIds.set(new Set(notes.map((note) => note.id)));
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
