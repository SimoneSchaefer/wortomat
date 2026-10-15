import {
  afterNextRender,
  Component,
  effect,
  type ElementRef,
  inject,
  Injectable,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { I18n } from './i18n/i18n';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  /** Irreversible (deleting): red button plus a hint. Defaults to true. */
  destructive?: boolean;
}

interface PendingRequest extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

/** Replacement for `window.confirm()`. The dialog is rendered by {@link ConfirmDialogHost}. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialog {
  readonly pending = signal<PendingRequest | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    // A question still open counts as cancelled.
    this.pending()?.resolve(false);
    return new Promise((resolve) => this.pending.set({ ...request, resolve }));
  }

  answer(confirmed: boolean): void {
    const request = this.pending();
    if (!request) return;
    this.pending.set(null);
    request.resolve(confirmed);
  }
}

/** Included once in the app. */
@Component({
  selector: 'wm-confirm-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="confirm.answer(false)"
      (click)="closeOnBackdrop($event)"
    >
      @if (confirm.pending(); as request) {
        <div class="body">
          <h2 id="confirm-title">{{ request.title }}</h2>
          <p id="confirm-message">
            {{ request.message }}
            @if (request.destructive !== false) {
              <span class="muted">{{ t().confirm.irreversible }}</span>
            }
          </p>
          <footer>
            <!-- Focus on "Cancel": an accidental Enter deletes nothing. -->
            <button type="button" class="cancel" (click)="confirm.answer(false)">
              {{ t().confirm.cancel }}
            </button>
            <button
              type="button"
              class="primary"
              [class.danger]="request.destructive !== false"
              (click)="confirm.answer(true)"
            >
              {{ request.confirmLabel }}
            </button>
          </footer>
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: min(26rem, calc(100vw - 2rem));
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--bg);
      color: var(--text);
      box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);

      &::backdrop {
        background: rgb(0 0 0 / 0.35);
      }

      &[open] {
        animation: pop-in 0.15s ease-out;
      }
    }

    .body {
      display: grid;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem;
    }

    h2 {
      margin: 0;
      font-family: var(--font-prose);
      font-weight: 400;
      font-size: 1.35rem;
    }

    p {
      margin: 0;
      font-size: 0.92rem;
      line-height: 1.5;
      overflow-wrap: anywhere;

      .muted {
        display: block;
        margin-top: 0.35rem;
        font-size: 0.85rem;
      }
    }

    footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .danger {
      border-color: var(--danger);
      background: var(--danger);
      // light on dark red, or dark on light red (dark colour scheme)
      color: var(--bg);

      &:hover:not(:disabled) {
        border-color: var(--danger);
        background: color-mix(in srgb, var(--danger) 85%, #000);
      }
    }

    @keyframes pop-in {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog[open] {
        animation: none;
      }
    }
  `,
})
export class ConfirmDialogHost {
  protected readonly confirm = inject(ConfirmDialog);
  protected readonly t = inject(I18n).t;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly injector = inject(Injector);

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.confirm.pending() && !dialog.open) {
        dialog.showModal();
        // The buttons only exist after rendering
        afterNextRender(() => dialog.querySelector<HTMLElement>('.cancel')?.focus(), {
          injector: this.injector,
        });
      } else if (!this.confirm.pending() && dialog.open) {
        dialog.close();
      }
    });
  }

  /** Only a click on the dimmed backdrop hits the dialog element itself. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.confirm.answer(false);
  }
}
