import { Injectable, signal } from '@angular/core';

/**
 * Asks the search in the top bar to search for a term – e.g. a click on a filler word in the
 * statistics. Every request is a new object so the same term triggers again when requested twice in
 * a row.
 */
@Injectable({ providedIn: 'root' })
export class SearchRequest {
  readonly request = signal<{ query: string } | null>(null);

  search(query: string): void {
    this.request.set({ query });
  }

  /**
   * Picks up the open request; it is done after that. Otherwise the search bar would run it again
   * every time it is created (e.g. back from the settings).
   */
  take(): { query: string } | null {
    const request = this.request();
    if (request) this.request.set(null);
    return request;
  }
}
