import { Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ProofImportResult, ProofNotesFile } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { PendingSaves } from '../../core/pending-saves';
import { ProofInboxStore } from '../../core/proof-inbox';
import { relativeTime } from '../../core/relative-time';
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
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly inbox = inject(ProofInboxStore);
  private readonly confirm = inject(ConfirmDialog);
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
  /** Namen der zuletzt gelöschten Notizdateien. */
  protected readonly cleaned = signal<string[] | null>(null);
  /** Notizdateien, deren Notizen alle im Buch sind – können weg. */
  protected readonly doneFiles = computed(
    () => this.inbox.inbox()?.files.filter((file) => file.done).length ?? 0,
  );

  constructor() {
    void this.inbox.refresh();
  }

  protected relativeTime(iso: string): string {
    return relativeTime(iso, this.i18n.language());
  }

  /** Alle neuen Notizen aus dem Download-Ordner übernehmen. */
  protected async importInbox(): Promise<void> {
    await this.runImport(() => this.api.importProofInbox());
  }

  /** Erledigte Notizdateien löschen – nach Rückfrage, sie liegen im Download-Ordner. */
  protected async clean(): Promise<void> {
    const t = this.t().proofreading;
    const confirmed = await this.confirm.ask({
      title: t.cleanTitle,
      message: t.cleanMessage(this.doneFiles(), this.inbox.inbox()?.dir ?? ''),
      confirmLabel: this.t().confirm.delete,
    });
    if (!confirmed) return;
    this.error.set(null);
    try {
      this.cleaned.set((await this.api.cleanProofInbox()).deleted);
      await this.inbox.refresh();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

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
    await this.runImport(() => this.api.importProofNotes(notes));
  }

  private async runImport(run: () => Promise<ProofImportResult>): Promise<void> {
    this.error.set(null);
    this.result.set(null);
    this.cleaned.set(null);
    this.importing.set(true);
    try {
      this.result.set(await run());
      await this.store.reloadNodes(); // neue Fixme-Zahlen im Baum
      await this.inbox.refresh();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.importing.set(false);
    }
  }
}
