import { Component } from '@angular/core';

/**
 * Der Dino aus dem App-Icon – als Begleiter bei leeren Zuständen. Reine Dekoration,
 * deshalb ohne Alternativtext; der Hinweis daneben trägt die Information.
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
