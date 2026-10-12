import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import type { NoteKind, NoteSummary, Tag, TagSummary } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { HorizontalScroll } from '../../core/horizontal-scroll';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { WortomatApi } from '../../core/wortomat-api';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KIND_LIST, NOTE_KINDS } from '../notes/note-kinds';
import { filterCandidates, hasExactTitle } from '../notes/note-matching';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from '../workspace/scene-filter';

const MAX_SUGGESTIONS = 8;

/** Wofür die Auswahl gerade offen ist: eine Notizart oder Tags. */
type Target = NoteKind | 'tag';

/** Ein Chip in einer Zeile – eine verknüpfte Notiz oder ein Tag. */
interface Chip {
  id: string;
  title: string;
  note?: NoteSummary;
}

interface Row {
  target: Target;
  label: string;
  singular: string;
  chips: Chip[];
}

/** Eintrag in der Auswahlliste. */
type Option =
  | { type: 'note'; note: NoteSummary }
  | { type: 'tag'; tag: TagSummary }
  | { type: 'create'; title: string };

/**
 * Leiste unter dem Szenentitel: welche Charaktere und Orte kommen vor, welche Tags hat die Szene?
 * Alle Zeilen teilen sich dieselbe Auswahl (Suche, Tastatur, „neu anlegen“).
 */
@Component({
  selector: 'wm-scene-links',
  imports: [NoteAvatar, Autofocus, HorizontalScroll],
  templateUrl: './scene-links.html',
  styleUrl: './scene-links.scss',
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class SceneLinks {
  readonly sceneId = input.required<string>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly store = inject(NotesStore);
  private readonly filter = inject(SceneFilter);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Nur IDs merken – Titel und Profilbild kommen aktuell aus dem NotesStore. */
  private readonly linkedIds = signal<ReadonlySet<string>>(new Set());
  private readonly tags = signal<Tag[]>([]);
  /** Alle Tags des Projekts; wird beim Öffnen der Tag-Auswahl frisch geladen. */
  private readonly allTags = signal<TagSummary[]>([]);
  protected readonly error = signal<string | null>(null);

  protected readonly rows = computed<Row[]>(() => [
    ...NOTE_KIND_LIST.filter((config) => config.linkable).map((config) => ({
      target: config.kind,
      label: this.t().noteKinds[config.kind].label,
      singular: this.t().noteKinds[config.kind].singular,
      chips: this.store
        .byKind(config.kind)
        .filter((note) => this.linkedIds().has(note.id))
        .map((note) => ({ id: note.id, title: note.title, note })),
    })),
    {
      target: 'tag' as const,
      label: this.t().sceneLinks.tags,
      singular: this.t().sceneLinks.tag,
      chips: this.tags().map((tag) => ({ id: tag.id, title: tag.name })),
    },
  ]);

  // Auswahl (Popover) ---------------------------------------------------------
  protected readonly pickerTarget = signal<Target | null>(null);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  /** Eingabe ohne führendes „#“ – Tags werden gern so getippt. */
  private readonly term = computed(() => this.query().trim().replace(/^#+/, '').trim());

  protected readonly options = computed<Option[]>(() => {
    const target = this.pickerTarget();
    if (!target) return [];
    const term = this.term();

    let options: Option[];
    let existing: Array<{ id: string; title: string }>;
    if (target === 'tag') {
      const items = this.allTags().map((tag) => ({ id: tag.id, title: tag.name, tag }));
      const assigned = new Set(this.tags().map((tag) => tag.id));
      existing = items;
      options = filterCandidates(items, assigned, term).map((item) => ({
        type: 'tag',
        tag: item.tag,
      }));
    } else {
      existing = this.store.byKind(target);
      options = filterCandidates(this.store.byKind(target), this.linkedIds(), term).map((note) => ({
        type: 'note',
        note,
      }));
    }

    options = options.slice(0, MAX_SUGGESTIONS);
    if (term && !hasExactTitle(existing, term)) {
      options.push({ type: 'create', title: term });
    }
    return options;
  });

  /** Text, wenn die Auswahl leer ist (Neuanlage ist dann über die Eingabe möglich). */
  protected readonly emptyHint = computed(() => {
    const target = this.pickerTarget();
    if (!target) return '';
    const t = this.t();
    if (target === 'tag') {
      return this.allTags().length ? t.sceneLinks.allTagsUsed : t.sceneLinks.noTags;
    }
    return this.store.byKind(target).length
      ? t.sceneLinks.allLinked
      : t.noteKinds[target].pickerEmpty;
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
    this.tags.set([]);
    try {
      const [notes, tags] = await Promise.all([
        this.api.sceneLinks(sceneId),
        this.api.sceneTags(sceneId),
      ]);
      if (loadId !== this.loadCounter) return;
      this.setLinked(notes);
      this.tags.set(tags);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }

  protected openPicker(target: Target): void {
    const opening = this.pickerTarget() !== target;
    this.pickerTarget.set(opening ? target : null);
    this.query.set('');
    this.activeIndex.set(0);
    if (opening && target === 'tag') {
      void this.run(async () => this.allTags.set(await this.api.listTags()));
    }
  }

  protected closePicker(): void {
    this.pickerTarget.set(null);
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
    if (this.pickerTarget() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closePicker();
    }
  }

  protected async choose(option: Option): Promise<void> {
    const target = this.pickerTarget();
    const sceneId = this.sceneId();
    if (!target) return;
    this.closePicker();
    await this.run(async () => {
      if (target === 'tag') {
        const name =
          option.type === 'tag' ? option.tag.name : 'title' in option ? option.title : '';
        this.tags.set(await this.api.addSceneTag(sceneId, name));
      } else {
        const note =
          option.type === 'note'
            ? option.note
            : await this.store.create(target, 'title' in option ? option.title : '');
        this.setLinked(await this.api.linkNote(sceneId, note.id));
      }
      this.reportToFilter(sceneId);
      this.scrollToEnd(target);
    });
  }

  /** Neu hinzugefügte Einträge stehen hinten – dorthin scrollen, damit man sie sieht. */
  private scrollToEnd(target: Target): void {
    afterNextRender(
      () => {
        const list = this.host.nativeElement.querySelector(`.chips[data-target="${target}"]`);
        list?.scrollTo({ left: list.scrollWidth, behavior: 'smooth' });
      },
      { injector: this.injector },
    );
  }

  protected async remove(row: Row, chip: Chip): Promise<void> {
    const sceneId = this.sceneId();
    await this.run(async () => {
      if (row.target === 'tag') {
        this.tags.set(await this.api.removeSceneTag(sceneId, chip.id));
      } else {
        this.setLinked(await this.api.unlinkNote(sceneId, chip.id));
      }
      this.reportToFilter(sceneId);
    });
  }

  /** Damit der Szenenfilter im Baum gleich die neuen Charaktere, Orte und Tags kennt. */
  private reportToFilter(sceneId: string): void {
    if (sceneId === this.sceneId()) {
      this.filter.updateScene(sceneId, [...this.linkedIds()], this.tags());
    }
  }

  protected open(note: NoteSummary): void {
    void this.router.navigate(['/write', NOTE_KINDS[note.kind].path, note.id]);
  }

  protected createLabel(title: string): string {
    const target = this.pickerTarget();
    if (!target) return '';
    const t = this.t();
    return target === 'tag' ? t.sceneLinks.createTag(title) : t.noteKinds[target].create(title);
  }

  private setLinked(notes: NoteSummary[]): void {
    this.linkedIds.set(new Set(notes.map((note) => note.id)));
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
