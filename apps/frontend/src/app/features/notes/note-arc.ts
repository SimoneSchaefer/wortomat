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
const DRAG_TYPE = 'application/x-wortomat-arc-step';

/** Where a dragged station would land. */
interface StepDrop {
  targetId: string;
  position: 'before' | 'after';
}

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

  protected readonly noScenes: ReadonlyMap<string, string> = new Map();
  protected readonly draggingId = signal<string | null>(null);
  protected readonly drop = signal<StepDrop | null>(null);

  /** Follows rearranging in the plot view and moving scenes in the manuscript. */
  private readonly projectStore = inject(ProjectStore);
  private readonly positions = computed(() => storyPositions(this.projectStore.tree()));
  protected readonly issues = computed(() => arcOrderIssues(this.steps(), this.positions()));
  /** Per flagged station: what to tell about it, and about each of its scenes out of place. */
  protected readonly hints = computed(() => {
    const result = new Map<string, { station: string; scenes: Map<string, string> }>();
    for (const [stepId, issue] of this.issues()) result.set(stepId, this.describe(issue));
    return result;
  });
  /** Only offered when it helps: overlapping scenes cannot be sorted away. */
  protected readonly canSort = computed(() => {
    const byId = new Map(this.steps().map((step) => [step.id, step]));
    const sorted = sortedByStory(this.steps(), this.positions()).map((id) => byId.get(id)!);
    return arcOrderIssues(sorted, this.positions()).size < this.issues().size;
  });

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

  protected onDragStart(event: DragEvent, step: ArcStep): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(DRAG_TYPE, step.id);
    // The whole station follows the pointer, not just its number
    const station = (event.target as HTMLElement).closest('.step');
    if (station) event.dataTransfer.setDragImage?.(station, 12, 12);
    this.draggingId.set(step.id);
  }

  protected onDragEnd(): void {
    this.draggingId.set(null);
    this.drop.set(null);
  }

  /** Upper half of the station: before, lower half: after – as in the other lists. */
  protected onDragOver(event: DragEvent, step: ArcStep): void {
    if (!this.draggingId() || !event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    this.drop.set({ targetId: step.id, position });
  }

  protected onDragLeave(event: DragEvent, step: ArcStep): void {
    const station = event.currentTarget as HTMLElement;
    if (station.contains(event.relatedTarget as Node | null)) return;
    if (this.drop()?.targetId === step.id) this.drop.set(null);
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const id = this.draggingId();
    const drop = this.drop();
    this.onDragEnd();
    if (!id || !drop) return;
    const order = this.steps().map((step) => step.id);
    const beforeId =
      drop.position === 'before'
        ? drop.targetId
        : (order[order.indexOf(drop.targetId) + 1] ?? null);
    // Already in this place? Then do nothing.
    if (beforeId === id || (order[order.indexOf(id) + 1] ?? null) === beforeId) return;
    await this.move(
      this.steps().find((step) => step.id === id)!,
      beforeId,
    );
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

  /**
   * When the whole station fits elsewhere, that place; otherwise (its scenes reach past other
   * stations) each scene out of place.
   */
  private describe({ slot, clashes }: ArcOrderIssue): {
    station: string;
    scenes: Map<string, string>;
  } {
    const number = (id: string) => this.steps().findIndex((step) => step.id === id) + 1;
    const texts = this.t().arc;
    const scenes = new Map(
      clashes.map(({ sceneId, relation, stationId }) => {
        const title = this.projectStore.findNode(sceneId)?.title ?? '';
        const text =
          relation === 'before'
            ? texts.sceneBefore(title, number(stationId))
            : texts.sceneAfter(title, number(stationId));
        return [sceneId, text];
      }),
    );
    let station: string;
    if (!slot) station = [...scenes.values()].join('\n');
    else if (slot.afterId && slot.beforeId) {
      station = texts.belongsBetween(number(slot.afterId), number(slot.beforeId));
    } else if (slot.afterId) station = texts.belongsAfter(number(slot.afterId));
    else station = texts.belongsBefore(number(slot.beforeId!));
    return { station, scenes };
  }

  protected async sortByStory(): Promise<void> {
    const stepIds = sortedByStory(this.steps(), this.positions());
    await this.mutate(() => this.api.reorderArcSteps(this.noteId(), stepIds));
  }

  protected async addScene(step: ArcStep, sceneId: string): Promise<void> {
    const arc = await this.mutate(() => this.api.addArcStepScene(step.id, sceneId));
    if (arc) this.sceneLinked.emit();
  }

  protected async removeScene(step: ArcStep, sceneId: string): Promise<void> {
    await this.mutate(() => this.api.removeArcStepScene(step.id, sceneId));
  }

  protected async remove(step: ArcStep): Promise<void> {
    if (step.label || step.details || step.sceneIds.length) {
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
