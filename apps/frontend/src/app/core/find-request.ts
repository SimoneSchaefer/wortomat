import { Injectable, signal } from '@angular/core';

export interface FindRequestData {
  documentId: string;
  query: string;
}

/**
 * Asks the editor to highlight a term once the document is open – a click on a search hit. Not in
 * the URL: clicking the same hit again after closing the find bar must work too, and going back
 * should not bring the highlighting back.
 */
@Injectable({ providedIn: 'root' })
export class FindRequest {
  readonly request = signal<FindRequestData | null>(null);

  find(documentId: string, query: string): void {
    this.request.set({ documentId, query });
  }

  /** Picks up the open request for this document; it is done after that. */
  take(documentId: string): string | null {
    const request = this.request();
    if (request?.documentId !== documentId) return null;
    this.request.set(null);
    return request.query;
  }
}
