import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ProofImportResult, ProofNotesFile } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
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

  protected readonly importing = signal(false);
  protected readonly result = signal<ProofImportResult | null>(null);

  protected back(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['/write']);
    }
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
