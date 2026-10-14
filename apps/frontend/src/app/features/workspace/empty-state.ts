import { Component, inject, input } from '@angular/core';
import { I18n, type Texts } from '../../core/i18n/i18n';
import { Mascot } from '../../core/mascot';

/**
 * Platzhalter im Inhaltsbereich, solange links nichts ausgewählt ist.
 * Der Text kommt aus den Routendaten – als Funktion, damit er der Sprache folgt.
 */
@Component({
  selector: 'wm-empty-state',
  imports: [Mascot],
  template: `
    <div class="content">
      <wm-mascot />
      <p class="muted">{{ message()?.(t()) }}</p>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      height: 100%;
      padding: 2rem;
      text-align: center;
    }

    .content {
      display: grid;
      justify-items: center;
      gap: 1rem;
      max-width: 26rem;
    }

    p {
      margin: 0;
    }
  `,
})
export class EmptyState {
  readonly message = input<(t: Texts) => string>();

  protected readonly t = inject(I18n).t;
}
