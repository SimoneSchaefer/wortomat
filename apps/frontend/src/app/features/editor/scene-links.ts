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
import type { NoteKind, NoteSummary, Strand, StrandColor, Tag, TagSummary } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { HorizontalScroll } from '../../core/horizontal-scroll';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { STRAND_COLORS, strandColor } from '../../core/strands';
import { WortomatApi } from '../../core/wortomat-api';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KIND_LIST, NOTE_KINDS } from '../notes/note-kinds';
import { filterCandidates, hasExactTitle } from '../notes/note-matching';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from '../workspace/scene-filter';
import { StatusMessages } from '../../core/status-messages';

const MAX_SUGGESTIONS = 8;

type Target = 'strand' | NoteKind | 'tag';

interface Chip {
  id: string;
  title: string;
  note?: NoteSummary;
  strand?: Strand;
}

interface Row {
  target: Target;
  label: string;
  singular: string;
  chips: Chip[];
}

type Option =
  | { type: 'note'; note: NoteSummary }
  | { type: 'tag'; tag: TagSummary }
  | { type: 'strand'; strand: Strand }
  | { type: 'create'; title: string };

/**
 * Bar below the scene title: which plot threads the scene belongs to, which characters and places
 * appear, which tags it has. All rows share the same picker (search, keyboard, "create new"). Next
 * to the threads: is the scene a turning point?
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
  private readonly projectStore = inject(ProjectStore);
  private readonly confirm = inject(ConfirmDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Only remember IDs – title and profile picture come up to date from the NotesStore. */
  private readonly linkedIds = signal<ReadonlySet<string>>(new Set());
  private readonly tags = signal<Tag[]>([]);
  private readonly strands = signal<Strand[]>([]);
  /** Loaded fresh whenever the thread picker opens. */
  private readonly allStrands = signal<Strand[]>([]);
  /** Loaded fresh whenever the tag picker opens. */
  private readonly allTags = signal<TagSummary[]>([]);
  private readonly error = inject(StatusMessages).channel();

  protected readonly rows = computed<Row[]>(() => [
    {
      target: 'strand' as const,
      label: this.t().sceneLinks.strands,
      singular: this.t().sceneLinks.strand,
      chips: this.strands().map((strand) => ({ id: strand.id, title: strand.name, strand })),
    },
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

  protected readonly pickerTarget = signal<Target | null>(null);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  /** Tags are often typed with a leading "#". */
  private readonly term = computed(() => this.query().trim().replace(/^#+/, '').trim());

  protected readonly options = computed<Option[]>(() => {
    const target = this.pickerTarget();
    if (!target) return [];
    const term = this.term();

    let options: Option[];
    let existing: Array<{ id: string; title: string }>;
    if (target === 'strand') {
      const items = this.allStrands().map((strand) => ({
        id: strand.id,
        title: strand.name,
        strand,
      }));
      existing = items;
      options = filterCandidates(items, new Set(this.strands().map((s) => s.id)), term).map(
        (item) => ({ type: 'strand', strand: item.strand }),
      );
    } else if (target === 'tag') {
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

  /** Creating a new entry is still possible via the input then. */
  protected readonly emptyHint = computed(() => {
    const target = this.pickerTarget();
    if (!target) return '';
    const t = this.t();
    if (target === 'strand') {
      return this.allStrands().length ? t.sceneLinks.allStrandsUsed : t.sceneLinks.noStrands;
    }
    if (target === 'tag') {
      return this.allTags().length ? t.sceneLinks.allTagsUsed : t.sceneLinks.noTags;
    }
    return this.store.byKind(target).length
      ? t.sceneLinks.allLinked
      : t.noteKinds[target].pickerEmpty;
  });

  protected readonly turningPoint = computed(
    () => this.projectStore.findNode(this.sceneId())?.turningPoint ?? false,
  );

  protected readonly editingStrand = signal<Strand | null>(null);
  protected readonly strandColors = STRAND_COLORS;
  protected readonly strandColor = strandColor;

  private loadCounter = 0;

  constructor() {
    effect(() => {
      const sceneId = this.sceneId();
      untracked(() => {
        this.closePicker();
        this.editingStrand.set(null);
        void this.load(sceneId);
      });
    });
  }

  private async load(sceneId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    this.linkedIds.set(new Set());
    this.tags.set([]);
    this.strands.set([]);
    try {
      const [notes, tags, strands] = await Promise.all([
        this.api.sceneLinks(sceneId),
        this.api.sceneTags(sceneId),
        this.api.sceneStrands(sceneId),
      ]);
      if (loadId !== this.loadCounter) return;
      this.setLinked(notes);
      this.tags.set(tags);
      this.strands.set(strands);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }

  protected openPicker(target: Target): void {
    const opening = this.pickerTarget() !== target;
    this.pickerTarget.set(opening ? target : null);
    this.editingStrand.set(null);
    this.query.set('');
    this.activeIndex.set(0);
    if (opening && target === 'tag') {
      void this.run(async () => this.allTags.set(await this.api.listTags()));
    }
    if (opening && target === 'strand') {
      void this.run(async () => this.allStrands.set(await this.api.listStrands()));
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
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closePicker();
      this.editingStrand.set(null);
    }
  }

  protected async choose(option: Option): Promise<void> {
    const target = this.pickerTarget();
    const sceneId = this.sceneId();
    if (!target) return;
    this.closePicker();
    await this.run(async () => {
      if (target === 'strand') {
        const strand =
          option.type === 'strand'
            ? option.strand
            : await this.api.createStrand('title' in option ? option.title : '');
        this.strands.set(await this.api.addSceneStrand(sceneId, strand.id));
      } else if (target === 'tag') {
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

  /** New entries are at the end – scroll there so they are visible. */
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
      if (row.target === 'strand') {
        this.strands.set(await this.api.removeSceneStrand(sceneId, chip.id));
      } else if (row.target === 'tag') {
        this.tags.set(await this.api.removeSceneTag(sceneId, chip.id));
      } else {
        this.setLinked(await this.api.unlinkNote(sceneId, chip.id));
      }
      this.reportToFilter(sceneId);
    });
  }

  /**
   * So the scene filter in the tree knows the new threads, characters, places and tags right away.
   */
  private reportToFilter(sceneId: string): void {
    if (sceneId === this.sceneId()) {
      this.filter.updateScene(sceneId, {
        noteIds: [...this.linkedIds()],
        tags: this.tags(),
        strandIds: this.strands().map((strand) => strand.id),
      });
    }
  }

  protected async toggleTurningPoint(): Promise<void> {
    const sceneId = this.sceneId();
    await this.run(() => this.projectStore.setTurningPoint(sceneId, !this.turningPoint()));
  }

  protected toggleStrandEditor(strand: Strand): void {
    this.closePicker();
    this.editingStrand.set(this.editingStrand()?.id === strand.id ? null : strand);
  }

  protected onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.editingStrand.set(null);
    }
  }

  protected async renameStrand(strand: Strand, value: string): Promise<void> {
    const name = value.trim();
    if (!name || name === strand.name) return;
    await this.run(async () =>
      this.replaceStrand(await this.api.updateStrand(strand.id, { name })),
    );
  }

  protected async recolorStrand(strand: Strand, color: StrandColor): Promise<void> {
    if (color === strand.color) return;
    await this.run(async () =>
      this.replaceStrand(await this.api.updateStrand(strand.id, { color })),
    );
  }

  /** Asks first, because the thread is attached to many scenes. */
  protected async deleteStrand(strand: Strand): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.sceneLinks.deleteStrandTitle,
      message: t.sceneLinks.deleteStrandMessage(strand.name, strand.sceneCount),
      confirmLabel: t.confirm.delete,
    });
    if (!confirmed) return;
    const sceneId = this.sceneId();
    await this.run(async () => {
      await this.api.deleteStrand(strand.id);
      this.editingStrand.set(null);
      this.strands.update((strands) => strands.filter((s) => s.id !== strand.id));
      this.allStrands.update((strands) => strands.filter((s) => s.id !== strand.id));
      this.reportToFilter(sceneId);
    });
  }

  private replaceStrand(updated: Strand): void {
    const replace = (strands: Strand[]) =>
      strands.map((strand) => (strand.id === updated.id ? updated : strand));
    this.strands.update(replace);
    this.allStrands.update(replace);
    if (this.editingStrand()?.id === updated.id) this.editingStrand.set(updated);
  }

  protected open(note: NoteSummary): void {
    void this.router.navigate(['/write', NOTE_KINDS[note.kind].path, note.id]);
  }

  protected createLabel(title: string): string {
    const target = this.pickerTarget();
    if (!target) return '';
    const t = this.t();
    if (target === 'strand') return t.sceneLinks.createStrand(title);
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
