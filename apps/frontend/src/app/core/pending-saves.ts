import { Injectable } from '@angular/core';

type Flush = () => Promise<void>;

/**
 * Sammelstelle für „bitte jetzt sofort speichern“. Komponenten mit ungespeicherten
 * Änderungen (z. B. der Editor mit Autosave-Verzögerung) melden sich hier an.
 * Aufgerufen vor dem Schließen des Fensters oder des Projekts.
 */
@Injectable({ providedIn: 'root' })
export class PendingSaves {
  private readonly flushes = new Set<Flush>();

  register(flush: Flush): () => void {
    this.flushes.add(flush);
    return () => this.flushes.delete(flush);
  }

  async flushAll(): Promise<void> {
    await Promise.allSettled([...this.flushes].map((flush) => flush()));
  }
}
