import { Injectable, signal } from '@angular/core';

/**
 * Bittet die Suche in der oberen Leiste, nach einem Begriff zu suchen – z. B. ein Klick auf
 * ein Füllwort in der Statistik. Jede Anfrage ist ein neues Objekt, damit auch derselbe
 * Begriff zweimal hintereinander wieder auslöst.
 */
@Injectable({ providedIn: 'root' })
export class SearchRequest {
  readonly request = signal<{ query: string } | null>(null);

  search(query: string): void {
    this.request.set({ query });
  }
}
