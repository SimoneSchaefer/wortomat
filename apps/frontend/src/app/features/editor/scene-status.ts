import { Component, computed, ElementRef, inject, input, signal } from '@angular/core';
import type { ManuscriptNode, SceneStatus } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { ProjectStore } from '../../core/project-store';
import { SCENE_STATUSES, statusInfo } from '../../core/scene-status';

/**
 * Arbeitsstand der Szene als Stufenleiste: Idee → … → Fertig.
 * Bedienung wie eine Radiogruppe (ein Tab-Stopp, Pfeiltasten wechseln den Status).
 */
@Component({
  selector: 'wm-scene-status',
  templateUrl: './scene-status.html',
  styleUrl: './scene-status.scss',
})
export class SceneStatusPicker {
  readonly node = input.required<ManuscriptNode>();

  private readonly store = inject(ProjectStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly statuses = SCENE_STATUSES;
  protected readonly current = computed(() => statusInfo(this.node().status ?? 'idea'));
  protected readonly currentIndex = computed(() => SCENE_STATUSES.indexOf(this.current()));
  protected readonly error = signal<string | null>(null);

  protected async select(status: SceneStatus): Promise<void> {
    if (status === this.current().status) return;
    this.error.set(null);
    try {
      await this.store.setStatus(this.node().id, status);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const last = SCENE_STATUSES.length - 1;
    const index = this.currentIndex();
    const target =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? Math.min(index + 1, last)
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? Math.max(index - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (target === null) return;
    event.preventDefault();
    void this.select(SCENE_STATUSES[target]!.status);
    this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role=radio]')[target]?.focus();
  }
}
