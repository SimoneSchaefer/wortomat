import { Injectable } from '@angular/core';

type Flush = () => Promise<void>;

/**
 * Collects "please save right now" requests. Components with unsaved changes (e.g. the editor with
 * its autosave delay) register here. Called before the window or the project closes.
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
