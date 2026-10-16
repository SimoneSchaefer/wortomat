import { booleanAttribute, Component, input } from '@angular/core';

/**
 * The dino from the app icon – a companion for empty states. Pure decoration, hence no alt text;
 * the hint next to it carries the information. It dozes while nothing is selected – the
 * animation lives inside the SVG, which also honours reduced motion itself.
 */
@Component({
  selector: 'wm-mascot',
  template: `
    @if (sleeping()) {
      <img src="maskottchen-schlafend.svg" alt="" width="100" height="93" />
    } @else {
      <img src="maskottchen.svg" alt="" width="100" height="83" />
    }
  `,
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
export class Mascot {
  readonly sleeping = input(false, { transform: booleanAttribute });
}
