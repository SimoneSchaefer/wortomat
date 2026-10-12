import { Component, inject, input } from '@angular/core';
import { I18n, type Texts } from '../../core/i18n/i18n';

/**
 * Platzhalter im Inhaltsbereich, solange links nichts ausgewählt ist.
 * Der Text kommt aus den Routendaten – als Funktion, damit er der Sprache folgt.
 */
@Component({
  selector: 'wm-empty-state',
  template: `<p class="muted">{{ message()?.(t()) }}</p>`,
  styles: `
    :host {
      display: grid;
      place-items: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class EmptyState {
  readonly message = input<(t: Texts) => string>();

  protected readonly t = inject(I18n).t;
}
