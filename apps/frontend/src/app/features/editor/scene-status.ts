import { Component, computed, ElementRef, inject, input } from '@angular/core';
import type { ManuscriptNode, SceneStatus } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { celebrate } from '../../core/fireworks';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { SCENE_STATUSES, statusInfo } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { StatusMessages } from '../../core/status-messages';

/**
 * As a step bar: idea → … → final. Behaves like a radio group (one tab stop, arrow keys change the
 * status).
 */
@Component({
  selector: 'wm-scene-status',
  imports: [StatusIcon],
  templateUrl: './scene-status.html',
  styleUrl: './scene-status.scss',
})
export class SceneStatusPicker {
  readonly node = input.required<ManuscriptNode>();

  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly statuses = SCENE_STATUSES;
  protected readonly current = computed(() => statusInfo(this.node().status ?? 'idea'));
  protected readonly currentIndex = computed(() => SCENE_STATUSES.indexOf(this.current()));
  private readonly error = inject(StatusMessages).channel();

  /** `origin`: the step's button – for final, small fireworks rise there. */
  protected async select(status: SceneStatus, origin?: Element): Promise<void> {
    if (status === this.current().status) return;
    this.error.set(null);
    try {
      await this.store.setStatus(this.node().id, status);
      if (status === 'final' && origin) celebrate(origin);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
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
    const button =
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[role=radio]')[target];
    void this.select(SCENE_STATUSES[target]!.status, button);
    button?.focus();
  }
}
