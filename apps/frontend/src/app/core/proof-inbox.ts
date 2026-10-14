import { inject, Injectable, signal } from '@angular/core';
import type { ProofInbox } from '@wortomat/shared';
import { WortomatApi } from './wortomat-api';

/**
 * Notizdateien vom Handy im Download-Ordner. Der Arbeitsbereich fragt beim Öffnen und jedes Mal,
 * wenn das Fenster wieder in den Vordergrund kommt (z. B. nach dem Senden vom Handy).
 */
@Injectable({ providedIn: 'root' })
export class ProofInboxStore {
  private readonly api = inject(WortomatApi);

  readonly inbox = signal<ProofInbox | null>(null);

  /** Fehler (kein Buch offen, Ordner unlesbar …) sind hier kein Grund zur Meldung. */
  async refresh(): Promise<ProofInbox | null> {
    try {
      this.inbox.set(await this.api.proofInbox());
    } catch {
      this.inbox.set(null);
    }
    return this.inbox();
  }
}
