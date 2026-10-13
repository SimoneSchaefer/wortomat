import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ProofImportResult, ProofNotesFile } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { StatusMessages } from '../../core/status-messages';
import { WortomatApi } from '../../core/wortomat-api';

/**
 * Korrekturlesen unterwegs: Notizen vom Handy ins Buch übernehmen. Liegt außerhalb des
 * Arbeitsbereichs – so ist beim Import kein Editor offen, der die neuen Markierungen mit einem
 * älteren Stand überschreiben könnte.
 */
@Component({
  selector: 'wm-proofreading-page',
  imports: [RouterLink],
  templateUrl: './proofreading-page.html',
  styleUrl: './proofreading-page.scss',
})
export class ProofreadingPage {
  protected readonly t = inject(I18n).t;
  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly error = inject(StatusMessages).channel();

  protected readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly pendingSaves = inject(PendingSaves);

  protected readonly creating = signal(false);
  /** Wohin die Korrekturfassung ging: Pfad (Desktop) bzw. Dateiname (Download). */
  protected readonly created = signal<{ filePath: string | null; fileName: string } | null>(null);
  protected readonly importing = signal(false);
  protected readonly result = signal<ProofImportResult | null>(null);

  protected back(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['/write']);
    }
  }

  /** Korrekturfassung erstellen: Desktop mit Speichern-Dialog, im Browser als Download. */
  protected async createCopy(): Promise<void> {
    this.error.set(null);
    this.created.set(null);
    await this.pendingSaves.flushAll(); // das Neueste aus dem Editor gehört dazu
    this.creating.set(true);
    try {
      if (this.desktop) {
        const title = this.store.project()?.title ?? this.t().proofreading.defaultName;
        const name = `${title} – ${this.t().proofreading.defaultName}`;
        const filePath = await this.desktop.showExportDialog(name, 'html');
        if (!filePath) return;
        const result = await this.api.proofCopyToFile(filePath);
        this.created.set({ filePath: result.filePath, fileName: result.filePath });
      } else {
        const { blob, fileName } = await this.api.proofCopyDownload();
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        this.created.set({ filePath: null, fileName });
      }
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.creating.set(false);
    }
  }

  protected async showInFolder(): Promise<void> {
    const filePath = this.created()?.filePath;
    if (filePath && this.desktop) await this.desktop.showItemInFolder(filePath);
  }

  protected async onPicked(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = ''; // dieselbe Datei noch einmal wählen können
    if (!file) return;
    this.error.set(null);
    this.result.set(null);
    let notes: ProofNotesFile;
    try {
      notes = JSON.parse(await file.text()) as ProofNotesFile;
    } catch {
      this.error.set(this.t().proofreading.unreadable);
      return;
    }
    this.importing.set(true);
    try {
      this.result.set(await this.api.importProofNotes(notes));
      await this.store.reloadNodes(); // neue Fixme-Zahlen im Baum
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.importing.set(false);
    }
  }
}
