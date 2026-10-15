import { Component, type ElementRef, inject, signal, viewChild } from '@angular/core';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { CoverPicker } from './cover-picker';

const SAVE_DELAY_MS = 600;

type Field = 'title' | 'author';

@Component({
  selector: 'wm-book-dialog',
  imports: [CoverPicker],
  template: `
    <!-- Initial focus on the dialog itself: no field looks highlighted on opening -->
    <dialog
      #dialog
      tabindex="-1"
      aria-labelledby="book-dialog-title"
      (click)="closeOnBackdrop($event)"
      (close)="flush()"
    >
      <div class="body">
        <h2 id="book-dialog-title">{{ t().book.title }}</h2>

        <label class="field">
          <span>{{ t().book.titleLabel }}</span>
          <input
            [value]="title()"
            (input)="edit('title', $any($event.target).value)"
            (blur)="leaveTitle($any($event.target))"
          />
        </label>
        <label class="field">
          <span>{{ t().book.author }}</span>
          <input
            [value]="author()"
            [placeholder]="t().book.authorPlaceholder"
            (input)="edit('author', $any($event.target).value)"
            (blur)="flush()"
          />
          <small class="muted">{{ t().book.authorHint }}</small>
        </label>
        @if (error(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }

        <section>
          <h3>{{ t().export.cover }}</h3>
          <wm-cover-picker [hint]="t().workspace.coverHint" />
        </section>

        <footer>
          <button type="button" (click)="close()">{{ t().export.close }}</button>
        </footer>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(32rem, calc(100vw - 2rem));
      padding: 0;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--bg);
      color: var(--text);
      box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);
      outline: none;

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

    .field {
      display: grid;
      gap: 0.3rem;
      font-size: 0.85rem;
      color: var(--text-muted);

      input {
        color: var(--text);
        font-size: 0.95rem;
      }

      small {
        font-size: 0.75rem;
      }
    }

    section {
      display: grid;
      gap: 0.6rem;
    }

    h3 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 400;
      color: var(--text-muted);
    }

    .error {
      margin: 0;
      font-size: 0.85rem;
    }

    footer {
      display: flex;
      justify-content: flex-end;
    }
  `,
})
export class BookDialog {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly title = signal('');
  protected readonly author = signal('');
  protected readonly error = signal<string | null>(null);
  private pending: Partial<Record<Field, string>> = {};
  private timer: ReturnType<typeof setTimeout> | undefined;

  open(): void {
    const project = this.store.project();
    this.title.set(project?.title ?? '');
    this.author.set(project?.author ?? '');
    this.error.set(null);
    this.pending = {};
    const dialog = this.dialog().nativeElement;
    dialog.showModal();
    dialog.focus();
  }

  protected close(): void {
    this.dialog().nativeElement.close(); // saves via the close event
  }

  /** Only a click on the dimmed backdrop hits the dialog element itself. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }

  /** An empty title is not saved. */
  protected edit(field: Field, value: string): void {
    (field === 'title' ? this.title : this.author).set(value);
    if (field === 'title' && !value.trim()) {
      delete this.pending.title;
      return;
    }
    this.pending[field] = value;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /**
   * Do not leave an empty title. Reset the field directly: for the binding the value often did not
   * change at all (the saved title was the last one shown).
   */
  protected leaveTitle(input: HTMLInputElement): void {
    if (!this.title().trim()) {
      const saved = this.store.project()?.title ?? '';
      this.title.set(saved);
      input.value = saved;
    }
    void this.flush();
  }

  protected async flush(): Promise<void> {
    clearTimeout(this.timer);
    const changes = this.pending;
    this.pending = {};
    if (!Object.keys(changes).length) return;
    try {
      await this.store.updateDetails(changes);
      this.error.set(null);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
