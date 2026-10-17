import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { SceneReference } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { WortomatApi } from '../../core/wortomat-api';
import { StatusMessages } from '../../core/status-messages';

/** "Appears in": scenes a character or place is linked to. */
@Component({
  selector: 'wm-note-appearances',
  imports: [RouterLink],
  template: `
    <span class="label">{{ t().notes.appearsIn }}</span>
    @if (scenes(); as list) {
      @if (list.length) {
        <ol>
          @for (scene of list; track scene.id) {
            <li>
              <a [routerLink]="['/write/scene', scene.id]" [title]="scene.path.join(' › ')">
                @if (scene.path.length) {
                  <span class="path">{{ scene.path.at(-1) }} ›</span>
                }
                {{ scene.title }}
              </a>
            </li>
          }
        </ol>
      } @else {
        <span class="muted none">{{ t().notes.appearsNowhere }}</span>
      }
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      margin-top: 0.9rem;
      font-size: 0.82rem;
    }

    .label {
      flex-shrink: 0;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    // One scene per row – two rarely fitted side by side, which looked random
    ol {
      display: grid;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    a {
      color: var(--accent-strong);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .path {
      color: var(--text-muted);
    }

    .none {
      font-style: italic;
    }
  `,
})
export class NoteAppearances {
  readonly noteId = input.required<string>();
  /** Changes when links were made elsewhere on the page – then load again. */
  readonly version = input(0);

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  protected readonly scenes = signal<SceneReference[] | null>(null);
  private readonly error = inject(StatusMessages).channel();
  private loadCounter = 0;
  private loadedNoteId: string | null = null;

  constructor() {
    effect(() => {
      const noteId = this.noteId();
      this.version();
      untracked(() => void this.load(noteId));
    });
  }

  private async load(noteId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    // Reloading the same note keeps the old list until the new one is there (no flicker)
    if (noteId !== this.loadedNoteId) this.scenes.set(null);
    this.loadedNoteId = noteId;
    this.error.set(null);
    try {
      const scenes = await this.api.noteScenes(noteId);
      if (loadId === this.loadCounter) this.scenes.set(scenes);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }
}
