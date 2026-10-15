import { Component, inject } from '@angular/core';
import { I18n } from './i18n/i18n';
import { StatusMessages } from './status-messages';

/**
 * Shows error messages from every area in the same, clearly visible place. Appears only when there
 * is something to report.
 */
@Component({
  selector: 'wm-status-bar',
  template: `
    @if (status.messages().length) {
      <div class="bar" role="alert">
        <ul>
          @for (message of status.messages(); track message.id) {
            <li>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5.5M12 16.5v.01" />
              </svg>
              <span class="text">{{ message.text }}</span>
              @if (message.count > 1) {
                <span class="count">{{ t().status.times(message.count) }}</span>
              }
              <button
                type="button"
                class="close"
                [title]="t().status.dismiss"
                [attr.aria-label]="t().status.dismiss"
                (click)="status.dismiss(message.id)"
              >
                ×
              </button>
            </li>
          }
        </ul>
        @if (status.messages().length > 1) {
          <button type="button" class="link all" (click)="status.dismissAll()">
            {{ t().status.dismissAll }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 1000;
      pointer-events: none;
    }

    .bar {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      padding: 0.35rem 0.75rem;
      border-top: 1px solid color-mix(in srgb, var(--danger) 45%, var(--border));
      background: color-mix(in srgb, var(--danger) 12%, var(--surface));
      box-shadow: 0 -4px 14px rgb(0 0 0 / 0.08);
      color: var(--text);
      font-size: 0.85rem;
      pointer-events: auto;
      animation: slide-in 0.2s ease-out;
    }

    ul {
      flex: 1;
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
      max-height: 40vh;
      overflow-y: auto;
    }

    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 1.8rem;
    }

    svg {
      flex: none;
      width: 1.05rem;
      height: 1.05rem;
      fill: none;
      stroke: var(--danger);
      stroke-width: 2;
      stroke-linecap: round;
    }

    .text {
      flex: 1;
      min-width: 0;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }

    .count {
      flex: none;
      padding: 0 0.4rem;
      border-radius: 0.6rem;
      background: color-mix(in srgb, var(--danger) 18%, var(--surface));
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .close {
      flex: none;
      padding: 0.1rem 0.45rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 1.1rem;
      line-height: 1;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--danger) 15%, transparent);
        color: var(--text);
      }
    }

    .all {
      flex: none;
      margin-bottom: 0.35rem;
      font-size: 0.8rem;
    }

    @keyframes slide-in {
      from {
        transform: translateY(100%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bar {
        animation: none;
      }
    }
  `,
})
export class StatusBar {
  protected readonly status = inject(StatusMessages);
  protected readonly t = inject(I18n).t;
}
