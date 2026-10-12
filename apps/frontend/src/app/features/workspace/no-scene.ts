import { Component } from '@angular/core';

@Component({
  selector: 'wm-no-scene',
  template: `<p class="muted">
    Wähle links eine Szene aus – oder lege mit „+“ an einem Kapitel eine neue an.
  </p>`,
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
export class NoScene {}
