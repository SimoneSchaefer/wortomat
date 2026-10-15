import {
  Component,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { DirectoryEntry, DirectoryListing } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { WortomatApi } from '../../core/wortomat-api';

/**
 * File picker for browser mode: a browser provides no real file paths, so the local server reads
 * the folders. Only folders and .wortomat files are shown. Clicking a folder opens it,
 * double-clicking a file picks it right away.
 *
 * In `folder` mode a folder is picked (location for a new book): existing books are only shown for
 * orientation, the folder currently shown is what gets picked.
 */
@Component({
  selector: 'wm-file-picker-dialog',
  templateUrl: './file-picker-dialog.html',
  styleUrl: './file-picker-dialog.scss',
})
export class FilePickerDialog {
  private readonly api = inject(WortomatApi);
  protected readonly t = inject(I18n).t;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly mode = input<'file' | 'folder'>('file');
  readonly chosen = output<string>();

  protected readonly listing = signal<DirectoryListing | null>(null);
  protected readonly selected = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Or in the nearest existing folder above it. */
  open(dir?: string): void {
    this.selected.set(null);
    this.dialog().nativeElement.showModal();
    void this.load(dir);
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected async load(dir?: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.listing.set(await this.api.listDirectory(dir));
      this.selected.set(null);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()) || this.t().filePicker.loadFailed);
    } finally {
      this.loading.set(false);
    }
  }

  protected click(entry: DirectoryEntry): void {
    if (entry.kind === 'directory') {
      void this.load(entry.path);
    } else {
      this.selected.set(entry.path);
    }
  }

  protected confirm(): void {
    this.choose(this.mode() === 'folder' ? (this.listing()?.path ?? null) : this.selected());
  }

  protected choose(filePath: string | null): void {
    if (!filePath) return;
    this.close();
    this.chosen.emit(filePath);
  }

  /** Only a click on the dimmed backdrop hits the dialog element itself. */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
