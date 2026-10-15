import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  untracked,
  viewChild,
} from '@angular/core';
import type { GalleryImage, NoteKind, UpdateNoteRequest } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { PendingSaves } from '../../core/pending-saves';
import { WortomatApi } from '../../core/wortomat-api';
import { DocumentEditor, type DocumentSource } from '../editor/document-editor';
import { NoteLocation } from '../maps/note-location';
import { ImageGallery } from './image-gallery';
import { NoteAppearances } from './note-appearances';
import { NoteGroupPicker } from './note-group-picker';
import { NOTE_KINDS, outlineDoc } from './note-kinds';
import { NotesStore } from './notes-store';
import { StatusMessages } from '../../core/status-messages';

const META_SAVE_DELAY_MS = 600;
/** As in the backend (`NotesService.update`). */
const MAX_SUMMARY_LENGTH = 2000;

/** A character, place or research note: route `write/<kind>/:id`. */
@Component({
  selector: 'wm-note-page',
  imports: [DocumentEditor, ImageGallery, NoteAppearances, NoteGroupPicker, NoteLocation],
  templateUrl: './note-page.html',
  styleUrl: './note-page.scss',
})
export class NotePage {
  readonly id = input.required<string>();
  /** From the route data. */
  readonly kind = input.required<NoteKind>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly store = inject(NotesStore);
  private readonly injector = inject(Injector);
  private readonly titleInput = viewChild<ElementRef<HTMLTextAreaElement>>('titleInput');

  protected readonly config = computed(() => NOTE_KINDS[this.kind()]);
  protected readonly texts = computed(() => this.t().noteKinds[this.kind()]);
  protected readonly template = computed(() => outlineDoc(this.texts().outline));
  protected readonly note = computed(() => this.store.find(this.id()));
  private readonly error = inject(StatusMessages).channel();
  protected readonly maxSummaryLength = MAX_SUMMARY_LENGTH;

  // Only fill the inputs from the store when the note changes – not after every save, or a late
  // response could overwrite what was just typed.
  protected readonly titleDraft = linkedSignal({
    source: this.id,
    computation: (id) => untracked(() => this.store.find(id)?.title ?? ''),
  });
  protected readonly summaryDraft = linkedSignal({
    source: this.id,
    computation: (id) => untracked(() => this.store.find(id)?.summary ?? ''),
  });

  private pendingMeta: { id: string; request: UpdateNoteRequest } | null = null;
  private metaTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly source: DocumentSource = {
    load: (id) => this.api.noteContent(id),
    save: async (id, request) => {
      const saved = await this.api.saveNoteContent(id, request);
      this.store.setAnnotations(id, saved.annotations);
    },
  };

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flushMeta());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      void this.flushMeta();
    });

    effect(() => {
      const id = this.id();
      untracked(() => {
        void this.flushMeta(); // changes of the previous note
        this.error.set(null);
        // Freshly created? Then select the title right away for overwriting.
        if (this.store.find(id)?.title === this.texts().newTitle) {
          afterNextRender(
            () => {
              this.titleInput()?.nativeElement.focus();
              this.titleInput()?.nativeElement.select();
            },
            { injector: this.injector },
          );
        }
      });
    });
  }

  /** The title only wraps – pasted line breaks become spaces. */
  protected onTitleInput(field: HTMLTextAreaElement): void {
    if (/[\r\n]/.test(field.value)) field.value = field.value.replace(/\s*[\r\n]+\s*/g, ' ');
    const value = field.value;
    this.titleDraft.set(value);
    if (value.trim()) {
      this.queueMeta({ title: value });
    }
  }

  protected onTitleBlur(): void {
    if (!this.titleDraft().trim()) {
      this.titleDraft.set(this.note()?.title ?? '');
    }
  }

  protected onGalleryChanged(images: GalleryImage[]): void {
    this.store.setCover(this.id(), images[0]?.url ?? null, images[0]?.crop ?? null);
  }

  protected onSummaryInput(value: string): void {
    this.summaryDraft.set(value);
    this.queueMeta({ summary: value });
  }

  private queueMeta(patch: UpdateNoteRequest): void {
    const id = this.id();
    const previous = this.pendingMeta?.id === id ? this.pendingMeta.request : {};
    this.pendingMeta = { id, request: { ...previous, ...patch } };
    clearTimeout(this.metaTimer);
    this.metaTimer = setTimeout(() => void this.flushMeta(), META_SAVE_DELAY_MS);
  }

  private async flushMeta(): Promise<void> {
    clearTimeout(this.metaTimer);
    const pending = this.pendingMeta;
    this.pendingMeta = null;
    if (!pending || !this.store.find(pending.id)) return;
    try {
      await this.store.update(pending.id, pending.request);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
