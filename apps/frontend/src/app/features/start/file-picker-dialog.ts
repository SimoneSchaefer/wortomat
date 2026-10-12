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
 * Dateiauswahl für den Browser-Modus: Ein Browser liefert keine echten Dateipfade, daher
 * liest der lokale Server die Ordner. Gezeigt werden nur Ordner und .wortomat-Dateien.
 * Klick auf einen Ordner öffnet ihn, Doppelklick auf eine Datei wählt sie sofort.
 *
 * Im Modus `folder` wird ein Ordner gewählt (Speicherort für ein neues Buch): Vorhandene
 * Bücher sind nur zur Orientierung zu sehen, gewählt wird der gerade angezeigte Ordner.
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
  /** Der gewählte Pfad einer .wortomat-Datei bzw. eines Ordners. */
  readonly chosen = output<string>();

  protected readonly listing = signal<DirectoryListing | null>(null);
  protected readonly selected = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Öffnet den Dialog im Ordner `dir` (bzw. dem nächsten vorhandenen darüber). */
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

  /** Klick auf den abgedunkelten Hintergrund schließt (nur der trifft das Dialog-Element selbst). */
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
