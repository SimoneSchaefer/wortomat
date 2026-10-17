import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import type { ArcStep, NoteSummary } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { StatusMessages } from '../../core/status-messages';
import { WortomatApi } from '../../core/wortomat-api';
import { NoteAvatar } from '../notes/note-avatar';
import { NOTE_KINDS } from '../notes/note-kinds';
import { NotesStore } from '../notes/notes-store';

interface Entry {
  step: ArcStep;
  note: NoteSummary;
}

/**
 * In the scene details: which development stations of characters show in this scene – so while
 * writing it is clear what the scene has to do for them. Hidden when there are none.
 */
@Component({
  selector: 'wm-scene-arc-steps',
  imports: [NoteAvatar],
  template: `
    <span class="label" [title]="t().arc.inSceneHint">{{ t().arc.inScene }}</span>
    <ul>
      @for (entry of entries(); track entry.step.id) {
        <li>
          <button
            type="button"
            [title]="entry.step.details || entry.note.title"
            (click)="open(entry.note)"
          >
            <wm-note-avatar [note]="entry.note" />
            <span class="text">
              <strong>{{ entry.note.title }}:</strong>
              {{ entry.step.label || t().arc.stepPlaceholder }}
            </span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    :host {
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
      min-width: 0;
      font-family: var(--font-ui);
    }

    // As in the rows above (SceneLinks)
    .label {
      width: 5.5rem;
      flex-shrink: 0;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    ul {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      max-width: 100%;
      padding: 0.1rem 0.4rem 0.1rem 0.1rem;
      border: none;
      border-radius: 999px;
      background: none;
      font-size: 0.85rem;
      text-align: left;

      --avatar-size: calc(var(--pill-height) - 6px);

      &:hover:not(:disabled) {
        background: var(--hover);
      }
    }

    .text {
      min-width: 0;
    }
  `,
  host: { '[style.display]': "entries().length ? null : 'none'" },
})
export class SceneArcSteps {
  readonly sceneId = input.required<string>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly notes = inject(NotesStore);
  private readonly router = inject(Router);
  private readonly error = inject(StatusMessages).channel();
  private readonly steps = signal<ArcStep[]>([]);
  private loadCounter = 0;

  /** Name and picture always current from the NotesStore. */
  protected readonly entries = computed<Entry[]>(() =>
    this.steps().flatMap((step) => {
      const note = this.notes.find(step.noteId);
      return note ? [{ step, note }] : [];
    }),
  );

  constructor() {
    effect(() => {
      const sceneId = this.sceneId();
      untracked(() => void this.load(sceneId));
    });
  }

  private async load(sceneId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    this.steps.set([]);
    try {
      const steps = await this.api.sceneArcSteps(sceneId);
      if (loadId === this.loadCounter) this.steps.set(steps);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }

  protected open(note: NoteSummary): void {
    void this.router.navigate(['/write', NOTE_KINDS[note.kind].path, note.id]);
  }
}
