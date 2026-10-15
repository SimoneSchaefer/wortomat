import { Component } from '@angular/core';

/**
 * The dino from the app icon – a companion for empty states. Pure decoration, hence no alt text;
 * the hint next to it carries the information.
 */
@Component({
  selector: 'wm-mascot',
  template: `<img src="maskottchen.svg" alt="" width="100" height="83" />`,
  styles: `
    :host {
      display: block;
      width: 7rem;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
    }
  `,
})
export class Mascot {}
