import { Component, computed, input } from '@angular/core';
import type { SceneStatus } from '@wortomat/shared';

/** Anteil des gefüllten Tortenstücks je Status; `null` = gestrichelter leerer Kreis. */
const PROGRESS: Record<SceneStatus, number | null> = {
  idea: null,
  outline: 0.25,
  draft: 0.5,
  revised: 0.75,
  final: 1,
};

/**
 * Status als Form statt nur als Farbe (auch für Farbenblinde lesbar): ein Kreis, der sich
 * mit dem Fortschritt füllt – leer gestrichelt, ¼, ½, ¾, voll mit Haken.
 * Zeichnet in `currentColor`; der Haken nimmt `--status-icon-contrast` (Standard: Hintergrund).
 */
@Component({
  selector: 'wm-status-icon',
  template: `
    <svg viewBox="0 0 16 16" aria-hidden="true">
      @if (progress() === null) {
        <circle class="ring" cx="8" cy="8" r="6.25" stroke-dasharray="2.5 2.4" />
      } @else if (progress() === 1) {
        <circle cx="8" cy="8" r="7" fill="currentColor" />
        <path class="check" d="M4.8 8.2l2.1 2.1 4.3-4.5" />
      } @else {
        <circle class="ring" cx="8" cy="8" r="6.25" />
        <path [attr.d]="slice()" fill="currentColor" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      width: 0.8rem;
      height: 0.8rem;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .ring {
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
    }

    .check {
      fill: none;
      stroke: var(--status-icon-contrast, var(--bg));
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class StatusIcon {
  readonly status = input.required<SceneStatus>();

  protected readonly progress = computed(() => PROGRESS[this.status()]);

  /** Tortenstück ab 12 Uhr im Uhrzeigersinn. */
  protected readonly slice = computed(() => {
    const fraction = this.progress() ?? 0;
    const radius = 4;
    const angle = fraction * 2 * Math.PI;
    const x = 8 + radius * Math.sin(angle);
    const y = 8 - radius * Math.cos(angle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    return `M8 8V${8 - radius}A${radius} ${radius} 0 ${largeArc} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
  });
}
