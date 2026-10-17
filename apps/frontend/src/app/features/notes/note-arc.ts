import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { ArcStep, CharacterArc, UpdateArcStepRequest } from '@wortomat/shared';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { StatusMessages } from '../../core/status-messages';
import { WortomatApi } from '../../core/wortomat-api';
import { type ArcOrderIssue, arcOrderIssues, sortedByStory, storyPositions } from './arc-order';
import { ArcScenePicker } from './arc-scene-picker';

const SAVE_DELAY_MS = 600;

/**
 * "Development" of a character: the overall arc as text and its stations, each optionally with
 * the scene where it shows. Collapsed while empty, so minor characters stay compact.
 */
@Component({
  selector: 'wm-note-arc',
  imports: [ArcScenePicker],
  templateUrl: './note-arc.html',
  styleUrl: './note-arc.scss',
})
export class NoteArc {
  readonly noteId = input.required<string>();
  /** A station got a scene – the backend then links the character with it. */
  readonly sceneLinked = output<void>();

  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly confirm = inject(ConfirmDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly error = inject(StatusMessages).channel();

  protected readonly loaded = signal(false);
  protected readonly open = signal(false);
  protected readonly summary = signal('');
  protected readonly steps = signal<ArcStep[]>([]);
  /** Stations whose note field is shown although it is still empty. */
  protected readonly detailsShown = signal<ReadonlySet<string>>(new Set());

  /** Follows rearranging in the plot view and moving scenes in the manuscript. */
  private readonly projectStore = inject(ProjectStore);
  private readonly positions = computed(() => storyPositions(this.projectStore.tree()));
  protected readonly issues = computed(() => arcOrderIssues(this.steps(), this.positions()));

  // Typed text is saved delayed; responses never overwrite it (see apply())
  private pendingSummary: { noteId: string; summary: string } | null = null;
  private readonly pendingSteps = new Map<string, UpdateArcStepRequest>();
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private loadCounter = 0;

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flush());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      void this.flush();
    });

    effect(() => {
      const noteId = this.noteId();
      untracked(() => void this.load(noteId));
    });
  }

  private async load(noteId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    await this.flush(); // changes of the previous character
    this.loaded.set(false);
    this.error.set(null);
    try {
      const arc = await this.api.noteArc(noteId);
      if (loadId !== this.loadCounter) return;
      this.detailsShown.set(new Set());
      this.apply(arc);
      this.open.set(!!arc.summary || arc.steps.length > 0);
      this.loaded.set(true);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }

  protected onSummaryInput(value: string): void {
    this.summary.set(value);
    this.pendingSummary = { noteId: this.noteId(), summary: value };
    this.scheduleSave();
  }

  protected onStepInput(step: ArcStep, field: 'label' | 'details', value: string): void {
    this.steps.update((steps) =>
      steps.map((other) => (other.id === step.id ? { ...other, [field]: value } : other)),
    );
    this.pendingSteps.set(step.id, { ...this.pendingSteps.get(step.id), [field]: value });
    this.scheduleSave();
  }

  /** Enter: new station below. Alt+↑/↓: move. */
  protected onLabelKeydown(event: KeyboardEvent, index: number): void {
    const steps = this.steps();
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.addStep(steps[index + 1]?.id ?? null);
    } else if (event.altKey && event.key === 'ArrowUp') {
      event.preventDefault();
      if (index > 0) void this.move(steps[index], steps[index - 1].id);
    } else if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      if (index < steps.length - 1) void this.move(steps[index], steps[index + 2]?.id ?? null);
    }
  }

  protected showDetails(step: ArcStep): void {
    this.detailsShown.update((shown) => new Set(shown).add(step.id));
    this.focusStep(step.id, 'details');
  }

  protected async addStep(beforeId: string | null = null): Promise<void> {
    const before = new Set(this.steps().map((step) => step.id));
    const arc = await this.mutate(() => this.api.createArcStep(this.noteId(), { beforeId }));
    const created = arc?.steps.find((step) => !before.has(step.id));
    if (created) this.focusStep(created.id, 'label');
  }

  protected async move(step: ArcStep, beforeId: string | null): Promise<void> {
    await this.mutate(() => this.api.moveArcStep(step.id, beforeId));
    this.focusStep(step.id, 'label');
  }

  protected orderHint({ afterId, beforeId }: ArcOrderIssue): string {
    const number = (id: string) => this.steps().findIndex((step) => step.id === id) + 1;
    const texts = this.t().arc;
    if (afterId && beforeId) return texts.belongsBetween(number(afterId), number(beforeId));
    return afterId ? texts.belongsAfter(number(afterId)) : texts.belongsBefore(number(beforeId!));
  }

  protected async sortByStory(): Promise<void> {
    const stepIds = sortedByStory(this.steps(), this.positions());
    await this.mutate(() => this.api.reorderArcSteps(this.noteId(), stepIds));
  }

  protected async setScene(step: ArcStep, sceneId: string | null): Promise<void> {
    await this.mutate(() => this.api.updateArcStep(step.id, { sceneId }));
    if (sceneId) this.sceneLinked.emit();
  }

  protected async remove(step: ArcStep): Promise<void> {
    if (step.label || step.details || step.sceneId) {
      const confirmed = await this.confirm.ask({
        title: this.t().arc.removeTitle,
        message: this.t().arc.removeMessage(step.label || this.t().arc.stepPlaceholder),
        confirmLabel: this.t().confirm.delete,
      });
      if (!confirmed) return;
    }
    this.pendingSteps.delete(step.id);
    await this.mutate(() => this.api.deleteArcStep(step.id));
  }

  /** Changes to the list: typed text is saved first so the order of requests stays clear. */
  private async mutate(action: () => Promise<CharacterArc>): Promise<CharacterArc | null> {
    const noteId = this.noteId();
    this.error.set(null);
    try {
      await this.flush();
      const arc = await action();
      if (noteId === this.noteId()) this.apply(arc);
      return arc;
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
      return null;
    }
  }

  /** Takes the server state, except for text typed in the meantime. */
  private apply(arc: CharacterArc): void {
    if (!this.pendingSummary) this.summary.set(arc.summary);
    this.steps.set(arc.steps.map((step) => ({ ...step, ...this.pendingSteps.get(step.id) })));
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  private async flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    const summary = this.pendingSummary;
    const steps = [...this.pendingSteps];
    this.pendingSummary = null;
    this.pendingSteps.clear();
    try {
      if (summary) await this.api.updateArcSummary(summary.noteId, summary.summary);
      for (const [id, request] of steps) await this.api.updateArcStep(id, request);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  private focusStep(id: string, field: 'label' | 'details'): void {
    afterNextRender(
      () => {
        const element = this.host.nativeElement.querySelector<HTMLTextAreaElement>(
          `[data-step-id="${id}"] .step-${field}`,
        );
        element?.focus();
      },
      { injector: this.injector },
    );
  }
}
