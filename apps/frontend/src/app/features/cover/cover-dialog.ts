import { Component, type ElementRef, inject, viewChild } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';
import { CoverPicker } from './cover-picker';

/** Kleiner Dialog aus der oberen Leiste: Titelbild des Buchs wählen. */
@Component({
  selector: 'wm-cover-dialog',
  imports: [CoverPicker],
  template: `
    <dialog #dialog aria-labelledby="cover-dialog-title" (click)="closeOnBackdrop($event)">
      <div class="body">
        <h2 id="cover-dialog-title">{{ t().export.cover }}</h2>
        <wm-cover-picker [hint]="t().workspace.coverHint" />
        <footer>
          <button type="button" autofocus (click)="close()">{{ t().export.close }}</button>
        </footer>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(30rem, calc(100vw - 2rem));
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--bg);
      color: var(--text);
      box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);

      &::backdrop {
        background: rgb(0 0 0 / 0.35);
      }
    }

    .body {
      display: grid;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
    }

    h2 {
      margin: 0;
      font-family: var(--font-prose);
      font-weight: 400;
      font-size: 1.4rem;
    }

    footer {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class CoverDialog {
  protected readonly t = inject(I18n).t;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  /** Klick auf den abgedunkelten Hintergrund schließt (nur der trifft das Dialog-Element selbst). */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
