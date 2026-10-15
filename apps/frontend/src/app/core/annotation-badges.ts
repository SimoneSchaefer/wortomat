import { Component, inject, input } from '@angular/core';
import type { AnnotationCounts } from '@wortomat/shared';
import { type AnnotationInfo, ANNOTATION_KINDS } from './annotations';
import { I18n } from './i18n/i18n';

/**
 * Every kind in `kinds` gets a slot of the same width – even where it is missing – so the counts
 * line up in a list; present ones move to the right.
 */
@Component({
  selector: 'wm-annotation-badges',
  template: `
    @for (info of kinds(); track info.kind) {
      @if (counts()[info.kind]; as count) {
        <span class="slot">
          <span
            class="badge"
            [style.--annotation-color]="info.color"
            [title]="
              count +
              ' ' +
              (count === 1 ? t().annotations[info.kind].label : t().annotations[info.kind].plural)
            "
            >{{ count }}</span
          >
        </span>
      }
    }
  `,
  styles: `
    :host {
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      width: calc(var(--slots) * 1.4rem);
    }

    .slot {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      width: 1.4rem;
    }

    .badge {
      min-width: 1.1rem;
      padding: 0 0.3rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--annotation-color) 35%, transparent);
      box-shadow: inset 0 0 0 1px var(--annotation-color);
      font-size: 0.68rem;
      font-weight: 600;
      line-height: 1.1rem;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
  `,
  host: { '[style.--slots]': 'kinds().length' },
})
export class AnnotationBadges {
  readonly counts = input.required<AnnotationCounts>();
  readonly kinds = input<readonly AnnotationInfo[]>(ANNOTATION_KINDS);

  protected readonly t = inject(I18n).t;
}
