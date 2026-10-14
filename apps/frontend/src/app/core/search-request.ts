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

  /**
   * Holt die offene Anfrage ab; danach ist sie erledigt. Sonst führte die Suchleiste sie
   * jedes Mal erneut aus, wenn sie neu entsteht (z. B. zurück aus den Einstellungen).
   */
  take(): { query: string } | null {
    const request = this.request();
    if (request) this.request.set(null);
    return request;
  }
}
