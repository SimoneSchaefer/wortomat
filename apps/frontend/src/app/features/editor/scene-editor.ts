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
import { DecimalPipe } from '@angular/common';
import { Editor, type JSONContent } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import type { EditorDoc, SaveSceneContentRequest } from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';

/** Nach dieser Tipp-Pause wird gespeichert. */
const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = 'loading' | 'saved' | 'unsaved' | 'saving' | 'error';
type ToolbarCommand = 'bold' | 'italic' | 'heading2' | 'heading3' | 'quote' | 'undo' | 'redo';

@Component({
  selector: 'wm-scene-editor',
  imports: [DecimalPipe],
  templateUrl: './scene-editor.html',
  styleUrl: './scene-editor.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class SceneEditor {
  /** Szenen-ID aus der Route `write/scene/:id`. */
  readonly id = input.required<string>();

  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('editorHost');

  protected readonly node = computed(() =>
    this.store.nodes().find((node) => node.id === this.id()),
  );
  protected readonly status = signal<SaveStatus>('loading');
  protected readonly wordCount = signal(0);
  protected readonly error = signal<string | null>(null);
  /** Wird bei jeder Editor-Transaktion erhöht, damit die Toolbar ihren Zustand neu berechnet. */
  private readonly editorTick = signal(0);

  private editor: Editor | null = null;
  private sceneId: string | null = null;
  private dirty = false;
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
      const id = this.id();
      untracked(() => void this.load(id));
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
      const content = await this.api.sceneContent(id);
      if (loadId !== this.loadCounter) return; // inzwischen wurde eine andere Szene gewählt

      // Pro Szene ein eigener Editor, damit sich der Undo-Verlauf nicht vermischt.
      this.editor?.destroy();
      this.sceneId = id;
      this.dirty = false;
      this.editor = this.createEditor(content.doc);
      this.wordCount.set(content.wordCount);
      this.status.set('saved');
    } catch (error) {
      if (loadId !== this.loadCounter) return;
      this.status.set('error');
      this.error.set(errorMessage(error));
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
    if (!this.dirty || !this.editor || !this.sceneId) {
      return this.saveQueue;
    }

    const sceneId = this.sceneId;
    const request: SaveSceneContentRequest = {
      doc: this.editor.getJSON() as EditorDoc,
      text: this.editor.getText({ blockSeparator: '\n' }),
      wordCount: this.editor.storage.characterCount.words(),
    };
    this.dirty = false;
    this.status.set('saving');

    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await this.api.saveSceneContent(sceneId, request);
        this.store.setWordCount(sceneId, request.wordCount);
        if (this.sceneId === sceneId && !this.dirty) this.status.set('saved');
      } catch (error) {
        if (error instanceof HttpErrorResponse && error.status === 404) return; // Szene wurde gelöscht
        if (this.sceneId === sceneId) {
          this.dirty = true; // beim nächsten Tastendruck erneut versuchen
          this.status.set('error');
          this.error.set(errorMessage(error));
        }
      }
    });
    return this.saveQueue;
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
        Placeholder.configure({ placeholder: 'Es war einmal …' }),
      ],
      editorProps: {
        attributes: { class: 'wm-prose', spellcheck: 'true', lang: 'de' },
        handlePaste: (_view, event) => {
          const files = imageFiles(event.clipboardData);
          if (!files.length) return false;
          void this.insertImages(files);
          return true;
        },
        handleDrop: (view, event, _slice, moved) => {
          const files = imageFiles(event.dataTransfer);
          if (moved || !files.length) return false;
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
      onTransaction: () => this.editorTick.update((tick) => tick + 1),
    });
  }

  protected async insertImages(files: File[], position?: number): Promise<void> {
    const sceneId = this.sceneId;
    for (const file of files) {
      try {
        const image = await prepareImage(file);
        const info = await this.api.uploadImage(
          image.blob,
          image.fileName,
          image.width,
          image.height,
        );
        if (!this.editor || this.sceneId !== sceneId) return;
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
        this.error.set(`Bild „${file.name}“: ${errorMessage(error)}`);
      }
    }
  }

  protected onImagesPicked(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []).filter(isSupportedImage);
    input.value = '';
    void this.insertImages(files);
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
      case 'heading2':
        chain.toggleHeading({ level: 2 });
        break;
      case 'heading3':
        chain.toggleHeading({ level: 3 });
        break;
      case 'quote':
        chain.toggleBlockquote();
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
