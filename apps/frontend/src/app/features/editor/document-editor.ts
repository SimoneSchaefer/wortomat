import { HttpErrorResponse } from '@angular/common/http';
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
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Editor, type JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { isHistoryTransaction } from '@tiptap/pm/history';
import type { Fragment, Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import type { Transaction } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import type { AnnotationKind, EditorDoc, SaveDocumentRequest } from '@wortomat/shared';
import { ANNOTATION_KINDS } from '../../core/annotations';
import { AppSettingsStore } from '../../core/app-settings';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { PendingSaves } from '../../core/pending-saves';
import { wordCore } from '../../core/text-analysis';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';
import { Annotation, type AnnotationAt, annotationAt, annotationsIn } from './annotation-mark';
import { Indent } from './indent';
import { ReadingPositions } from './reading-position';
import { ToolbarMenu } from './toolbar-menu';
import { Revision, revisionResult } from './revision';
import type { Finding, FindingKind, RevisionResult } from './revision-check';
import { SmartQuotes } from './smart-quotes';
import { StatusMessages } from '../../core/status-messages';

/** Saves after this typing pause. */
const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';
type ToolbarCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'paragraph'
  | 'heading'
  | 'subheading'
  | 'blockquote'
  | 'bulletList'
  | 'orderedList'
  | 'indent'
  | 'outdent'
  | 'clearFormat'
  | 'undo'
  | 'redo';
type Alignment = 'left' | 'center' | 'right' | 'justify';

/** Scene, character, place … */
export interface DocumentSource {
  load(id: string): Promise<{ doc: EditorDoc | null; wordCount: number }>;
  save(id: string, request: SaveDocumentRequest): Promise<void>;
  /** Only scenes have a writing log. */
  writtenToday?(): Promise<number>;
}

/** For scenes and notes alike. Titles etc. are inserted above the text via content projection. */
@Component({
  selector: 'wm-document-editor',
  imports: [ToolbarMenu],
  templateUrl: './document-editor.html',
  styleUrl: './document-editor.scss',
  host: {
    '(window:beforeunload)': 'onBeforeUnload($event)',
  },
})
export class DocumentEditor {
  readonly documentId = input.required<string>();
  readonly source = input.required<DocumentSource>();
  /** Without one, "Once upon a time …". */
  readonly placeholder = input<string>();
  /** Initial content for documents that were never saved (e.g. a character's outline). */
  readonly template = input<EditorDoc | null>(null);
  /** Scenes only; notes do not need it. */
  readonly revisable = input(false);

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(WortomatApi);
  private readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly settings = inject(AppSettingsStore);
  private readonly notes = inject(NotesStore, { optional: true });
  private readonly injector = inject(Injector);
  private readonly readingPositions = inject(ReadingPositions);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('noteInput');

  protected readonly status = signal<SaveStatus>('loading');
  protected readonly wordCount = signal(0);
  /** `null` while unknown or when the source has no writing log. */
  protected readonly writtenToday = signal<number | null>(null);
  /** The setting applies to all scenes. */
  protected readonly revising = computed(
    () => this.revisable() && this.settings.settings().revisionMode,
  );
  /** `null` while the mode is off. */
  protected readonly revision = signal<RevisionResult | null>(null);
  protected readonly findingKinds: readonly FindingKind[] = [
    'repetition',
    'filler',
    'long',
    'double',
  ];
  private readonly error = inject(StatusMessages).channel();
  /** Bumped on every editor transaction so the toolbar recomputes its state. */
  private readonly editorTick = signal(0);

  private editor: Editor | null = null;
  private currentId: string | null = null;
  private dirty = false;
  /** Words pasted, moved or restored by undo/redo since the last save – not counted as written. */
  private pastedWords = 0;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** Saves run strictly one after another. */
  private saveQueue: Promise<void> = Promise.resolve();
  private loadCounter = 0;
  private stopTracking: (() => void) | null = null;

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flush());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      const editor = this.editor;
      this.stopTracking?.();
      this.stopTracking = null;
      // flush() reads the content synchronously; the editor may go after that.
      void this.flush();
      editor?.destroy();
      this.editor = null;
    });

    effect(() => {
      const id = this.documentId();
      untracked(() => void this.load(id));
    });

    effect(() => {
      const revising = this.revising();
      untracked(() => this.editor?.commands.setRevisionMode(revising));
    });
  }

  private async load(id: string): Promise<void> {
    const loadId = ++this.loadCounter;
    await this.flush();
    this.status.set('loading');
    this.error.set(null);

    try {
      const content = await this.source().load(id);
      if (loadId !== this.loadCounter) return; // another document was chosen meanwhile

      // One editor per document so the undo history does not mix.
      this.stopTracking?.();
      this.stopTracking = null;
      this.editor?.destroy();
      this.currentId = id;
      this.dirty = false;
      this.pastedWords = 0;
      this.editingNoteAt.set(null);
      this.editor = this.createEditor(content.doc ?? this.template());
      this.editor.commands.setRevisionMode(this.revising());
      this.wordCount.set(content.wordCount);
      this.stopTracking = this.readingPositions.track(id, this.editor);
      this.status.set('saved');
      void this.refreshWrittenToday();
    } catch (error) {
      if (loadId !== this.loadCounter) return;
      this.status.set('error');
      this.error.set(errorMessage(error, this.t()));
    }
  }

  private scheduleSave(): void {
    this.dirty = true;
    this.status.set('unsaved');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), AUTOSAVE_DELAY_MS);
  }

  flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    if (!this.dirty || !this.editor || !this.currentId) {
      return this.saveQueue;
    }

    const documentId = this.currentId;
    const source = this.source();
    const request: SaveDocumentRequest = {
      doc: this.editor.getJSON() as EditorDoc,
      text: this.editor.getText({ blockSeparator: '\n' }),
      wordCount: this.editor.storage.characterCount.words(),
      pastedWords: this.pastedWords,
    };
    this.dirty = false;
    this.pastedWords = 0;
    this.status.set('saving');

    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await source.save(documentId, request);
        if (this.currentId === documentId && !this.dirty) this.status.set('saved');
        void this.refreshWrittenToday();
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 404) return; // it was deleted
        if (this.currentId === documentId) {
          this.dirty = true; // retry on the next keystroke
          this.pastedWords += request.pastedWords ?? 0;
          this.status.set('error');
          this.error.set(errorMessage(error, this.t()));
        }
      }
    });
    return this.saveQueue;
  }

  private async refreshWrittenToday(): Promise<void> {
    const source = this.source();
    if (!source.writtenToday) {
      this.writtenToday.set(null);
      return;
    }
    try {
      this.writtenToday.set(await source.writtenToday());
    } catch {
      // display only – it works again on the next save
    }
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    // In Electron the main process saves through the bridge beforehand; never block there.
    if (!this.desktop && this.dirty) {
      event.preventDefault();
    }
  }

  private createEditor(doc: EditorDoc | null): Editor {
    return new Editor({
      element: this.host().nativeElement,
      content: (doc as JSONContent | null) ?? '',
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: { openOnClick: false },
        }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Indent,
        Image.configure({ allowBase64: false }),
        CharacterCount,
        Annotation.configure({ label: (kind) => this.t().annotations[kind].label }),
        SmartQuotes.configure({ style: () => this.settings.settings().quoteStyle }),
        Placeholder.configure({
          placeholder: this.placeholder() ?? this.t().editor.placeholder,
        }),
        Revision.configure({
          names: () => this.names(),
          describe: (finding) => this.describeFinding(finding),
          toggle: () => this.toggleRevision(),
        }),
      ],
      editorProps: {
        attributes: { class: 'wm-prose', spellcheck: 'true', lang: 'de' },
        handlePaste: (_view, event, slice) => {
          const files = imageFiles(event.clipboardData);
          if (!files.length) {
            this.pastedWords += wordsIn(slice);
            return false;
          }
          void this.insertImages(files);
          return true;
        },
        handleDrop: (view, event, slice, moved) => {
          const files = imageFiles(event.dataTransfer);
          if (moved || !files.length) {
            this.pastedWords += wordsIn(slice);
            return false;
          }
          event.preventDefault();
          const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
          void this.insertImages(files, position);
          return true;
        },
      },
      onUpdate: ({ editor, transaction }) => {
        // Undoing a deletion brings back words that were counted when they were first typed.
        if (isHistoryTransaction(transaction)) this.pastedWords += insertedWords(transaction);
        this.wordCount.set(editor.storage.characterCount.words());
        this.scheduleSave();
      },
      onTransaction: ({ editor }) => {
        this.editorTick.update((tick) => tick + 1);
        this.revision.set(revisionResult(editor.state));
      },
    });
  }

  protected async insertImages(files: File[], position?: number): Promise<void> {
    const documentId = this.currentId;
    for (const file of files) {
      try {
        const image = await prepareImage(file);
        const info = await this.api.uploadImage(
          image.blob,
          image.fileName,
          image.width,
          image.height,
        );
        if (!this.editor || this.currentId !== documentId) return;
        const content = {
          type: 'image',
          attrs: { src: info.url, alt: file.name.replace(/\.[^.]+$/, '') },
        };
        const chain = this.editor.chain().focus();
        (position === undefined
          ? chain.insertContent(content)
          : chain.insertContentAt(position, content)
        ).run();
        position = undefined; // insert further images after the first one
      } catch (error) {
        this.error.set(this.t().editor.imageFailed(file.name, errorMessage(error, this.t())));
      }
    }
  }

  protected isActive(
    nameOrAttributes: string | Record<string, unknown>,
    attributes?: Record<string, unknown>,
  ): boolean {
    this.editorTick();
    if (!this.editor) return false;
    return typeof nameOrAttributes === 'string'
      ? this.editor.isActive(nameOrAttributes, attributes)
      : this.editor.isActive(nameOrAttributes);
  }

  protected can(action: 'undo' | 'redo'): boolean {
    this.editorTick();
    return this.editor?.can()[action]() ?? false;
  }

  /** "Text" is checked when no other paragraph style applies. */
  protected readonly isParagraph = computed(
    () =>
      !this.isActive('heading', { level: 2 }) &&
      !this.isActive('heading', { level: 3 }) &&
      !this.isActive('blockquote'),
  );

  /** Without an explicit alignment the text runs left like in the editor. */
  protected readonly alignment = computed<Alignment>(() => {
    for (const alignment of ['center', 'right', 'justify'] as const) {
      if (this.isActive({ textAlign: alignment })) return alignment;
    }
    return 'left';
  });

  protected align(alignment: Alignment): void {
    this.editor?.chain().focus().setTextAlign(alignment).run();
  }

  /** Stroke paths in a 16 × 16 box, like the other toolbar icons. */
  protected readonly icons = {
    left: 'M2.5 3.5h11M2.5 6.5h7M2.5 9.5h11M2.5 12.5h7',
    center: 'M2.5 3.5h11M4.5 6.5h7M2.5 9.5h11M4.5 12.5h7',
    right: 'M2.5 3.5h11M6.5 6.5h7M2.5 9.5h11M6.5 12.5h7',
    justify: 'M2.5 3.5h11M2.5 6.5h11M2.5 9.5h11M2.5 12.5h11',
    indent: 'M7.5 4h6M7.5 8h6M7.5 12h6M2.5 5.5L5 8l-2.5 2.5',
    outdent: 'M7.5 4h6M7.5 8h6M7.5 12h6M5 5.5L2.5 8 5 10.5',
    bulletList: 'M6.5 4h7M6.5 8h7M6.5 12h7M3 4h.01M3 8h.01M3 12h.01',
    orderedList: 'M6.5 4h7M6.5 8h7M6.5 12h7M2.5 3l1-.5v3M2.5 10h1.5l-1.5 2h1.5',
  } as const;
  protected readonly alignments: readonly Alignment[] = ['left', 'center', 'right', 'justify'];
  /** Shortcuts of the text-align extension (Ctrl+Shift+L/E/R/J). */
  protected readonly alignKeys: Record<Alignment, string> = {
    left: 'L',
    center: 'E',
    right: 'R',
    justify: 'J',
  };

  protected alignLabel(alignment: Alignment): string {
    const t = this.t().editor;
    return {
      left: t.alignLeft,
      center: t.alignCenter,
      right: t.alignRight,
      justify: t.alignJustify,
    }[alignment];
  }

  protected readonly annotationKinds = ANNOTATION_KINDS;
  /** e.g. "Bold (Ctrl+B)" */
  protected hint(label: string, key: string, options?: { shift?: boolean; alt?: boolean }): string {
    return `${label} (${this.shortcut(key, options)})`;
  }

  protected shortcut(key: string, options?: { shift?: boolean; alt?: boolean }): string {
    return this.i18n.shortcut()(key, options);
  }

  protected annotate(kind: AnnotationKind): void {
    this.editor?.chain().focus().toggleAnnotation(kind).run();
  }

  protected colorOf(kind: AnnotationKind): string {
    return ANNOTATION_KINDS.find((info) => info.kind === kind)?.color ?? 'var(--annotation-todo)';
  }

  protected readonly annotation = computed(() => {
    this.editorTick();
    return this.editor ? annotationAt(this.editor.state) : null;
  });

  protected readonly allAnnotations = computed(() => {
    this.editorTick();
    const doc = this.editor?.state.doc;
    if (!doc) return [];
    // Cursor moves keep the same document – do not search again then
    if (doc !== this.listedFor) {
      this.listedFor = doc;
      this.listed = annotationsIn(doc);
    }
    return this.listed;
  });
  private listedFor: ProseMirrorNode | null = null;
  private listed: AnnotationAt[] = [];

  protected readonly listOpen = signal(true);
  /** Start of the mark whose note is being edited. */
  protected readonly editingNoteAt = signal<number | null>(null);

  protected resolveAnnotation(accept: boolean): void {
    this.editor?.chain().focus().resolveAnnotation(accept).run();
  }

  protected editNote(annotation: AnnotationAt): void {
    // Leave the text right away: the input only gets focus after rendering, and anything typed
    // until then would otherwise land in the scene. Not `commands.blur()`: it runs a frame later
    // and clears the selection, possibly after the input already has the focus.
    this.editor?.view.dom.blur();
    this.editingNoteAt.set(annotation.from);
    // Only once the input is in the page; focusing it any earlier silently does nothing
    afterNextRender(
      () => {
        const input = this.noteInput()?.nativeElement;
        input?.focus();
        input?.setSelectionRange(input.value.length, input.value.length);
      },
      { injector: this.injector },
    );
  }

  /** Enter, "Done" or a click elsewhere. */
  protected saveNote(note: string): void {
    if (this.editingNoteAt() === null) return; // already saved (Enter, then blur)
    this.editingNoteAt.set(null);
    this.editor?.chain().focus().setAnnotationNote(note).run();
  }

  protected cancelNote(): void {
    this.editingNoteAt.set(null);
    this.editor?.commands.focus();
  }

  /**
   * Puts the cursor at the start of the passage so the bar shows the mark. The passage goes to the
   * middle; ProseMirror would push it barely into view, under the toolbar or status bar.
   */
  protected jumpTo(annotation: AnnotationAt): void {
    const editor = this.editor;
    if (!editor) return;
    editor.chain().focus(annotation.from, { scrollIntoView: false }).run();
    const { node } = editor.view.domAtPos(annotation.from + 1);
    const element = node instanceof Element ? node : node.parentElement;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  protected toggleRevision(): void {
    if (!this.revisable()) return;
    this.settings
      .setRevisionMode(!this.settings.settings().revisionMode)
      .catch((error: unknown) => this.error.set(errorMessage(error, this.t())));
  }

  protected nextFinding(kind: FindingKind): void {
    this.editor?.commands.selectNextFinding(kind);
  }

  /** Names of characters and places, lowercase and split into single words ("Anna Berger"). */
  private names(): ReadonlySet<string> {
    const names = new Set<string>();
    for (const note of this.notes?.notes() ?? []) {
      if (note.kind !== 'character' && note.kind !== 'place') continue;
      for (const part of note.title.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
        if (part) names.add(part);
      }
    }
    return names;
  }

  private describeFinding(finding: Finding): string {
    const texts = this.t().revision;
    switch (finding.kind) {
      case 'repetition':
        return finding.other === 'before'
          ? texts.repeatedBefore(finding.word, finding.distance)
          : texts.repeatedAfter(finding.word, finding.distance);
      case 'filler':
        return texts.fillerTip(finding.word);
      case 'long':
        return texts.longTip(finding.words);
      case 'double':
        return texts.doubleTip(finding.word);
    }
  }

  protected command(command: ToolbarCommand): void {
    if (!this.editor) return;
    const chain = this.editor.chain().focus();
    switch (command) {
      case 'bold':
        chain.toggleBold();
        break;
      case 'italic':
        chain.toggleItalic();
        break;
      case 'underline':
        chain.toggleUnderline();
        break;
      case 'strike':
        chain.toggleStrike();
        break;
      case 'paragraph':
        // Out of quotes too: "Text" is the plain paragraph
        chain.setParagraph().lift('blockquote');
        break;
      case 'heading':
        chain.setHeading({ level: 2 });
        break;
      case 'subheading':
        chain.setHeading({ level: 3 });
        break;
      case 'blockquote':
        chain.toggleBlockquote();
        break;
      case 'bulletList':
        chain.toggleBulletList();
        break;
      case 'orderedList':
        chain.toggleOrderedList();
        break;
      case 'indent':
        chain.indent();
        break;
      case 'outdent':
        chain.outdent();
        break;
      case 'clearFormat':
        // Remove all marks (bold, italic, links, todo/idea/fixme …), turn headings/quotes/lists into
        // plain paragraphs and drop alignment and indentation.
        chain.unsetAllMarks().clearNodes().unsetTextAlign().resetAttributes('paragraph', 'indent');
        break;
      case 'undo':
        chain.undo();
        break;
      case 'redo':
        chain.redo();
        break;
    }
    chain.run();
  }
}

function imageFiles(data: DataTransfer | null): File[] {
  return Array.from(data?.files ?? []).filter(isSupportedImage);
}

/** Counted like the editor does. */
function wordsIn(slice: Slice): number {
  return wordList(slice.content).length;
}

/**
 * Only an estimate: the words between the first and the last change. The backend caps it at what
 * its own diff counts as added.
 */
function insertedWords(transaction: Transaction): number {
  // Compared like the backend diff: "hier." and "hier," are the same word.
  const before = wordList(transaction.before.content).map(comparable);
  const after = wordList(transaction.doc.content).map(comparable);
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--;
    endAfter--;
  }
  return endAfter - start;
}

function comparable(word: string): string {
  return wordCore(word).toLowerCase();
}

function wordList(content: Fragment): string[] {
  return content.textBetween(0, content.size, ' ', ' ').split(/\s+/).filter(Boolean);
}
