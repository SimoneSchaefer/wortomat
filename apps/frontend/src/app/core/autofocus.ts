import { afterNextRender, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: 'input[wmAutofocus]' })
export class Autofocus {
  constructor() {
    const element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      element.focus();
      element.select();
    });
  }
}
