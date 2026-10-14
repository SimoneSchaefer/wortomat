import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Editor, type JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import type { AnnotationKind, EditorDoc, SaveDocumentRequest } from '@wortomat/shared';
import { ANNOTATION_KINDS } from '../../core/annotations';
import { AppSettingsStore } from '../../core/app-settings';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { PendingSaves } from '../../core/pending-saves';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';
import { Annotation, type AnnotationAt, annotationAt, annotationsIn } from './annotation-mark';
import { Revision, revisionResult } from './revision';
import type { Finding, FindingKind, RevisionResult } from './revision-check';
import { SmartQuotes } from './smart-quotes';
import { StatusMessages } from '../../core/status-messages';

/** Nach dieser Tipp-Pause wird gespeichert. */
const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';
type ToolbarCommand = 'bold' | 'italic' | 'underline' | 'strike' | 'clearFormat' | 'undo' | 'redo';

/** Woher der Editor ein Dokument lädt und wohin er speichert (Szene, Charakter, Ort …). */
export interface DocumentSource {
  load(id: string): Promise<{ doc: EditorDoc | null; wordCount: number }>;
  save(id: string, request: SaveDocumentRequest): Promise<void>;
  /** Heute geschriebene Wörter fürs Schreib-Log – nur Szenen haben eins. */
  writtenToday?(): Promise<number>;
}

/**
 * Rich-Text-Editor mit Autosave, Bildern und Toolbar – für Szenen wie für Notizen.
 * Überschriften o. Ä. werden per Content-Projection über dem Text eingefügt.
 */
@Component({
  selector: 'wm-document-editor',
  templateUrl: './document-editor.html',
  styleUrl: './document-editor.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class DocumentEditor {
  readonly documentId = input.required<string>();
  readonly source = input.required<DocumentSource>();
  /** Platzhalter im leeren Dokument; ohne Angabe „Es war einmal …“. */
  readonly placeholder = input<string>();
  /** Startinhalt für Dokumente, die noch nie gespeichert wurden (z. B. Gliederung eines Charakters). */
  readonly template = input<EditorDoc | null>(null);
  /** Überarbeitungsmodus anbieten (Szenen); Notizen brauchen ihn nicht. */
  readonly revisable = input(false);

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(WortomatApi);
  private readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly settings = inject(AppSettingsStore);
  private readonly notes = inject(NotesStore, { optional: true });
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private readonly noteInput = viewChild<ElementRef<HTMLInputElement>>('noteInput');

  protected readonly status = signal<SaveStatus>('loading');
  protected readonly wordCount = signal(0);
  /** `null`, solange unbekannt oder die Quelle kein Schreib-Log hat. */
  protected readonly writtenToday = signal<number | null>(null);
  /** Überarbeitungsmodus: Einstellung gilt für alle Szenen. */
  protected readonly revising = computed(
    () => this.revisable() && this.settings.settings().revisionMode,
  );
  /** Fundstellen der letzten Prüfung; `null` bei ausgeschaltetem Modus. */
  protected readonly revision = signal<RevisionResult | null>(null);
  protected readonly findingKinds: readonly FindingKind[] = [
    'repetition',
    'filler',
    'long',
    'double',
  ];
  private readonly error = inject(StatusMessages).channel();
  /** Wird bei jeder Editor-Transaktion erhöht, damit die Toolbar ihren Zustand neu berechnet. */
  private readonly editorTick = signal(0);

  private editor: Editor | null = null;
  private currentId: string | null = null;
  private dirty = false;
  /** Seit dem letzten Speichern eingefügte/verschobene Wörter – zählen im Schreib-Log nicht. */
  private pastedWords = 0;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** Speichervorgänge laufen strikt nacheinander. */
  private saveQueue: Promise<void> = Promise.resolve();
  private loadCounter = 0;

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flush());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      const editor = this.editor;
      // flush() liest den Inhalt synchron aus; danach darf der Editor weg.
      void this.flush();
      editor?.destroy();
      this.editor = null;
    });

    effect(() => {
      const id = this.documentId();
      untracked(() => void this.load(id));
    });

    // Notizfeld erscheint → gleich hineinschreiben können
    effect(() => this.noteInput()?.nativeElement.focus());

    effect(() => {
      const revising = this.revising();
      untracked(() => this.editor?.commands.setRevisionMode(revising));
    });
  }

  // -------------------------------------------------------------------------
  // Laden & Speichern
  // -------------------------------------------------------------------------

  private async load(id: string): Promise<void> {
    const loadId = ++this.loadCounter;
    await this.flush();
    this.status.set('loading');
    this.error.set(null);

    try {
      const content = await this.source().load(id);
      if (loadId !== this.loadCounter) return; // inzwischen wurde ein anderes Dokument gewählt

      // Pro Dokument ein eigener Editor, damit sich der Undo-Verlauf nicht vermischt.
      this.editor?.destroy();
      this.currentId = id;
      this.dirty = false;
      this.pastedWords = 0;
      this.editingNoteAt.set(null);
      this.editor = this.createEditor(content.doc ?? this.template());
      this.editor.commands.setRevisionMode(this.revising());
      this.wordCount.set(content.wordCount);
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

  /** Speichert sofort, falls es ungespeicherte Änderungen gibt. */
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
        if (error instanceof HttpErrorResponse && error.status === 404) return; // wurde gelöscht
        if (this.currentId === documentId) {
          this.dirty = true; // beim nächsten Tastendruck erneut versuchen
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
      // nur eine Anzeige – beim nächsten Speichern klappt es wieder
    }
  }

  protected onBeforeUnload(event: BeforeUnloadEvent): void {
    // In Electron speichert der Hauptprozess vorher über die Bridge; dort nie blockieren.
    if (!this.desktop && this.dirty) {
      event.preventDefault();
    }
  }

  // -------------------------------------------------------------------------
  // Editor
  // -------------------------------------------------------------------------

  private createEditor(doc: EditorDoc | null): Editor {
    return new Editor({
      element: this.host().nativeElement,
      content: (doc as JSONContent | null) ?? '',
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          link: { openOnClick: false },
        }),
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
      onUpdate: ({ editor }) => {
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
        position = undefined; // weitere Bilder hinter dem ersten einfügen
      } catch (error) {
        this.error.set(this.t().editor.imageFailed(file.name, errorMessage(error, this.t())));
      }
    }
  }

  // Toolbar -------------------------------------------------------------------

  protected isActive(name: string, attributes?: Record<string, unknown>): boolean {
    this.editorTick();
    return this.editor?.isActive(name, attributes) ?? false;
  }

  protected can(action: 'undo' | 'redo'): boolean {
    this.editorTick();
    return this.editor?.can()[action]() ?? false;
  }

  protected readonly annotationKinds = ANNOTATION_KINDS;
  /** z. B. „Fett (Strg+B)“ */
  protected hint(label: string, key: string, options?: { shift?: boolean; alt?: boolean }): string {
    return `${label} (${this.i18n.shortcut()(key, options)})`;
  }

  protected annotate(kind: AnnotationKind): void {
    this.editor?.chain().focus().toggleAnnotation(kind).run();
  }

  protected colorOf(kind: AnnotationKind): string {
    return ANNOTATION_KINDS.find((info) => info.kind === kind)?.color ?? 'var(--annotation-todo)';
  }

  // Markierungen mit Notiz ------------------------------------------------------

  /** Markierung am Cursor – erscheint mit Notiz bzw. Vorschlag unter der Toolbar. */
  protected readonly annotation = computed(() => {
    this.editorTick();
    return this.editor ? annotationAt(this.editor.state) : null;
  });

  /** Alle Markierungen (mit und ohne Notiz) – als Liste über dem Text. */
  protected readonly allAnnotations = computed(() => {
    this.editorTick();
    const doc = this.editor?.state.doc;
    if (!doc) return [];
    // Bei Cursorbewegungen bleibt das Dokument dasselbe – dann nicht neu suchen
    if (doc !== this.listedFor) {
      this.listedFor = doc;
      this.listed = annotationsIn(doc);
    }
    return this.listed;
  });
  private listedFor: ProseMirrorNode | null = null;
  private listed: AnnotationAt[] = [];

  protected readonly listOpen = signal(true);
  /** Anfang der Markierung, deren Notiz gerade bearbeitet wird. */
  protected readonly editingNoteAt = signal<number | null>(null);

  /** Vorschlag übernehmen (`accept`) oder die Markierung ohne Änderung abhaken. */
  protected resolveAnnotation(accept: boolean): void {
    this.editor?.chain().focus().resolveAnnotation(accept).run();
  }

  protected editNote(annotation: AnnotationAt): void {
    // Sofort aus dem Text: das Feld bekommt den Fokus erst nach dem Rendern, bis dahin
    // Getipptes landete sonst in der Szene
    this.editor?.commands.blur();
    this.editingNoteAt.set(annotation.from);
  }

  /** Enter, „Fertig“ oder Klick daneben. Danach geht es im Text weiter. */
  protected saveNote(note: string): void {
    if (this.editingNoteAt() === null) return; // schon gespeichert (Enter, dann blur)
    this.editingNoteAt.set(null);
    this.editor?.chain().focus().setAnnotationNote(note).run();
  }

  protected cancelNote(): void {
    this.editingNoteAt.set(null);
    this.editor?.commands.focus();
  }

  /**
   * Aus der Liste: Cursor an den Anfang der Stelle – dann zeigt die Leiste die Markierung. Die Stelle
   * kommt in die Mitte; ProseMirror schöbe sie nur knapp ins Bild, unter Toolbar oder Statusleiste.
   */
  protected jumpTo(annotation: AnnotationAt): void {
    const editor = this.editor;
    if (!editor) return;
    editor.chain().focus(annotation.from, { scrollIntoView: false }).run();
    const { node } = editor.view.domAtPos(annotation.from + 1);
    const element = node instanceof Element ? node : node.parentElement;
    element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // Überarbeitungsmodus ---------------------------------------------------------

  protected toggleRevision(): void {
    if (!this.revisable()) return;
    this.settings
      .setRevisionMode(!this.settings.settings().revisionMode)
      .catch((error: unknown) => this.error.set(errorMessage(error, this.t())));
  }

  protected nextFinding(kind: FindingKind): void {
    this.editor?.commands.selectNextFinding(kind);
  }

  /** Namen von Figuren und Orten, klein und in Einzelwörter zerlegt („Anna Berger“). */
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
      case 'clearFormat':
        // Alle Marks (Fett, Kursiv, Links, Todo/Idee/Fixme …) entfernen und
        // Überschriften/Zitate zu normalen Absätzen machen.
        chain.unsetAllMarks().clearNodes();
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

/** Wörter in eingefügtem oder gezogenem Inhalt – gezählt wie vom Editor. */
function wordsIn(slice: Slice): number {
  return slice.content.textBetween(0, slice.content.size, ' ', ' ').split(/\s+/).filter(Boolean)
    .length;
}
