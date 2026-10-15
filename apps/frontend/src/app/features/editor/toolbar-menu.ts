import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

/**
 * A dropdown in the editor toolbar: groups related buttons so the bar does not wrap. The entries
 * are projected buttons with a `menuitem…` role; choosing one closes the menu.
 *
 * Not encapsulated: the entries are declared in the editor's template, whose scoped styles would
 * not reach them from here. All rules sit below `wm-toolbar-menu` instead.
 */
@Component({
  selector: 'wm-toolbar-menu',
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      #toggle
      type="button"
      class="menu-toggle"
      aria-haspopup="menu"
      [class.on]="active()"
      [attr.aria-expanded]="open()"
      [title]="label()"
      [attr.aria-label]="label()"
      (click)="open.set(!open())"
    >
      <ng-content select="[toggle]" />
      <svg class="caret" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M4.5 6.5L8 10l3.5-3.5" />
      </svg>
    </button>
    @if (open()) {
      <div
        #menu
        class="menu"
        role="menu"
        [attr.aria-label]="label()"
        (keydown)="keydown($event)"
        (click)="chosen($event)"
      >
        <ng-content />
      </div>
    }
  `,
  styleUrl: './toolbar-menu.scss',
  host: {
    '(document:pointerdown)': 'outside($event)',
    '(keydown.escape)': 'close()',
  },
})
export class ToolbarMenu {
  readonly label = input.required<string>();
  /** Highlights the toggle, e.g. while the cursor is in a list. */
  readonly active = input(false);

  protected readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly toggle = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  constructor() {
    // Keyboard users land on the first entry; for mouse users this shows no focus ring
    effect(() => this.items()[0]?.focus());
  }

  protected outside(event: PointerEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.toggle().nativeElement.focus();
  }

  protected chosen(event: MouseEvent): void {
    if ((event.target as Element).closest('[role^=menuitem]')) this.open.set(false);
  }

  protected keydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = this.items();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    items[(index + step + items.length) % items.length]?.focus();
    event.preventDefault();
  }

  private items(): HTMLElement[] {
    const menu = this.menu()?.nativeElement;
    return menu ? [...menu.querySelectorAll<HTMLElement>('[role^=menuitem]')] : [];
  }
}
