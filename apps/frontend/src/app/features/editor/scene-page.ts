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
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { DocumentEditor, type DocumentSource } from './document-editor';
import { SceneLinks } from './scene-links';
import { SceneStatusPicker } from './scene-status';
import { StatusMessages } from '../../core/status-messages';

const TITLE_SAVE_DELAY_MS = 600;

/** Eine Szene des Manuskripts: Route `write/scene/:id`. */
@Component({
  selector: 'wm-scene-page',
  imports: [DocumentEditor, SceneLinks, SceneStatusPicker],
  template: `
    <wm-document-editor [documentId]="id()" [source]="source" [revisable]="true">
      <input
        #titleInput
        class="doc-title doc-input"
        [attr.aria-label]="t().common.title"
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
    </wm-document-editor>
  `,
  styles: `
    // Leicht getönte Seite: Szenendetails und Text liegen als helle Kästen darauf
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      --editor-page-bg: color-mix(in srgb, var(--bg) 40%, var(--surface));
      background: var(--editor-page-bg);
    }

    // Szenendetails als zusammengehöriger Kasten zwischen Titel und Text – Rahmen wie der
    // Kasten von Toolbar und Text darunter
    .scene-meta {
      display: grid;
      gap: 0.4rem;
      margin: 0.75rem 0 2rem;
      padding: 0.75rem 1rem;
      border: 1px solid color-mix(in srgb, var(--border) 70%, var(--bg));
      border-radius: 0.75rem;
      background: var(--bg);
    }
  `,
})
export class ScenePage {
  readonly id = input.required<string>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly injector = inject(Injector);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');

  protected readonly node = computed(() => this.store.findNode(this.id()));
  private readonly error = inject(StatusMessages).channel();

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
    writtenToday: async () => (await this.api.writingToday()).added,
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
        this.store.reveal(id); // z. B. über die Suche geöffnet: im Baum aufklappen
        // Frisch angelegt (Standardtitel)? Dann gleich den Titel zum Überschreiben markieren.
        if (this.store.findNode(id)?.title === this.t().tree.newTitle.scene) {
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
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
