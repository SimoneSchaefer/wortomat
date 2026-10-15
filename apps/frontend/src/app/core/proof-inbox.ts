import { inject, Injectable, signal } from '@angular/core';
import type { ProofInbox } from '@wortomat/shared';
import { WortomatApi } from './wortomat-api';

/**
 * Notes files from the phone in the downloads folder. The workspace asks on opening and every time
 * the window comes back to the front (e.g. after sending from the phone).
 */
@Injectable({ providedIn: 'root' })
export class ProofInboxStore {
  private readonly api = inject(WortomatApi);

  readonly inbox = signal<ProofInbox | null>(null);

  /** Errors (no book open, folder unreadable …) are no reason for a message here. */
  async refresh(): Promise<ProofInbox | null> {
    try {
      this.inbox.set(await this.api.proofInbox());
    } catch {
      this.inbox.set(null);
    }
    return this.inbox();
  }
}
