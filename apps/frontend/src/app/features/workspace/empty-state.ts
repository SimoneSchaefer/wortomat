import { Component, input } from '@angular/core';

/** Platzhalter im Inhaltsbereich, solange links nichts ausgewählt ist. Text kommt aus den Routendaten. */
@Component({
  selector: 'wm-empty-state',
  template: `<p class="muted">{{ message() }}</p>`,
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
  readonly message = input('');
}
