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
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { NEW_SCENE_TITLE, ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { DocumentEditor, type DocumentSource } from './document-editor';
import { SceneLinks } from './scene-links';
import { SceneStatusPicker } from './scene-status';

const TITLE_SAVE_DELAY_MS = 600;

/** Eine Szene des Manuskripts: Route `write/scene/:id`. */
@Component({
  selector: 'wm-scene-page',
  imports: [DocumentEditor, SceneLinks, SceneStatusPicker],
  template: `
    <wm-document-editor [documentId]="id()" [source]="source">
      <input
        #titleInput
        class="doc-title doc-input"
        aria-label="Titel"
        [value]="titleDraft()"
        (input)="onTitleInput($any($event.target).value)"
        (blur)="onTitleBlur()"
        (keydown.enter)="titleInput.blur()"
      />
      <div class="scene-meta">
        @if (node(); as scene) {
          <wm-scene-status [node]="scene" />
        }
        <wm-scene-links [sceneId]="id()" />
      </div>
      @if (error(); as message) {
        <p class="error" role="alert">{{ message }}</p>
      }
    </wm-document-editor>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }

    .scene-meta {
      display: grid;
      gap: 0.4rem;
      margin: 0.75rem 0 2rem;
    }
  `,
})
export class ScenePage {
  readonly id = input.required<string>();

  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly injector = inject(Injector);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly node = computed(() => this.store.findNode(this.id()));
  protected readonly error = signal<string | null>(null);

  // Nur beim Wechsel der Szene aus dem Store füllen – nicht nach jedem Speichern,
  // sonst könnte eine verspätete Antwort gerade Getipptes überschreiben.
  protected readonly titleDraft = linkedSignal({
    source: this.id,
    computation: (id) => untracked(() => this.store.findNode(id)?.title ?? ''),
  });

  private pendingTitle: { id: string; title: string } | null = null;
  private titleTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly source: DocumentSource = {
    load: (id) => this.api.sceneContent(id),
    save: async (id, request) => {
      const saved = await this.api.saveSceneContent(id, request);
      this.store.updateSceneStats(id, saved.wordCount, saved.annotations);
    },
  };

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flushTitle());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      void this.flushTitle();
    });

    effect(() => {
      const id = this.id();
      untracked(() => {
        void this.flushTitle(); // Änderungen der vorherigen Szene
        this.error.set(null);
        // Frisch angelegt? Dann gleich den Titel zum Überschreiben markieren.
        if (this.store.findNode(id)?.title === NEW_SCENE_TITLE) {
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

  protected onTitleInput(value: string): void {
    this.titleDraft.set(value);
    const title = value.trim();
    if (!title) return;
    this.pendingTitle = { id: this.id(), title };
    clearTimeout(this.titleTimer);
    this.titleTimer = setTimeout(() => void this.flushTitle(), TITLE_SAVE_DELAY_MS);
  }

  /** Leeren Titel nicht stehen lassen. */
  protected onTitleBlur(): void {
    if (!this.titleDraft().trim()) {
      this.titleDraft.set(this.node()?.title ?? '');
    }
  }

  private async flushTitle(): Promise<void> {
    clearTimeout(this.titleTimer);
    const pending = this.pendingTitle;
    this.pendingTitle = null;
    const node = pending && this.store.findNode(pending.id);
    if (!pending || !node || node.title === pending.title) return;
    try {
      await this.store.renameNode(pending.id, pending.title);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
