import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';

/** The browser's own tooltip waits about this long too. */
const SHOW_DELAY_MS = 500;
/** Moving on to the next element within this time shows its tooltip at once (scanning a row). */
const WARM_MS = 300;
const GAP_PX = 6;
const MARGIN_PX = 8;

const SELECTOR = '[data-tip], [title], [data-wm-title]';

/**
 * One tooltip for the whole app, so all of them look the same (theme colours, wrapped text) instead
 * of the browser's own `title` popups. Reads `title` – it stays in the markup as the accessible
 * name – or `data-tip` for purely visual elements such as calendar cells.
 *
 * While the pointer is over an element its `title` is parked in `data-wm-title`, or the browser
 * would show its own tooltip on top. Keyboard focus leaves it in place: screen readers need it then.
 */
@Component({
  selector: 'wm-tooltip',
  // A popover lives in the top layer, so the tooltip shows above modal dialogs too
  template: '<div #tip class="tooltip" popover="manual" aria-hidden="true"></div>',
  styles: `
    .tooltip {
      position: fixed;
      inset: auto;
      margin: 0;
      max-width: 20rem;
      padding: 0.3rem 0.55rem;
      border: none;
      border-radius: 0.35rem;
      overflow: visible;
      background: var(--text);
      color: var(--bg);
      font-family: var(--font-ui);
      font-size: 0.75rem;
      line-height: 1.35;
      white-space: pre-line;
      overflow-wrap: anywhere;
      pointer-events: none;
    }
  `,
  host: {
    '(document:pointerover)': 'pointerOver($event)',
    '(document:pointerout)': 'pointerOut($event)',
    '(document:pointerdown)': 'pointerDown()',
    '(document:focusin)': 'focusIn($event)',
    '(document:focusout)': 'focusOut()',
    '(document:keydown)': 'keyDown()',
    '(window:blur)': 'release()',
  },
})
export class Tooltip {
  private readonly tip = viewChild.required<ElementRef<HTMLElement>>('tip');

  private anchor: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private visible = false;
  private hiddenAt = 0;
  /** Tooltips on focus only for keyboard users, not after every click into a field. */
  private keyboard = false;

  constructor() {
    // Scrolling does not bubble – listen in the capture phase to catch every scrolling container
    const onScroll = () => this.hide();
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      this.release();
    });
  }

  protected pointerOver(event: PointerEvent): void {
    // Touch has no hover; a tap would leave the tooltip standing
    if (event.pointerType === 'touch') return;
    const target = this.anchorOf(event.target);
    if (target !== this.anchor) {
      this.release();
      if (!target) return;
      this.anchor = target;
      this.schedule();
    }
    // Also when keyboard focus already shows the tooltip for it
    const title = target?.getAttribute('title');
    if (target && title != null) {
      target.setAttribute('data-wm-title', title);
      target.removeAttribute('title');
    }
  }

  protected pointerOut(event: PointerEvent): void {
    const next = event.relatedTarget as Node | null;
    if (this.anchor && next && this.anchor.contains(next)) return;
    this.release();
  }

  protected pointerDown(): void {
    this.keyboard = false;
    // Stays parked until the pointer leaves, or the browser's tooltip would pop up after the click
    this.hide();
  }

  protected focusIn(event: FocusEvent): void {
    if (!this.keyboard) return;
    const target = this.anchorOf(event.target);
    if (!target || target === this.anchor) return;
    this.release();
    this.anchor = target;
    this.schedule();
  }

  protected focusOut(): void {
    if (this.keyboard) this.release();
  }

  protected keyDown(): void {
    this.keyboard = true;
    this.hide();
  }

  /** Hides the tooltip and gives the anchor its `title` back. */
  protected release(): void {
    this.hide();
    const anchor = this.anchor;
    this.anchor = null;
    const parked = anchor?.getAttribute('data-wm-title');
    if (!anchor || parked == null) return;
    anchor.removeAttribute('data-wm-title');
    // Angular may have bound a new title in the meantime – that one wins
    if (!anchor.hasAttribute('title')) anchor.setAttribute('title', parked);
  }

  private anchorOf(target: EventTarget | null): HTMLElement | null {
    const found = (target as Element | null)?.closest?.<HTMLElement>(SELECTOR) ?? null;
    return found && this.textOf(found) ? found : null;
  }

  private textOf(element: HTMLElement): string {
    return (
      element.dataset['tip'] ||
      element.getAttribute('title') ||
      element.dataset['wmTitle'] ||
      ''
    ).trim();
  }

  private schedule(): void {
    clearTimeout(this.timer);
    const warm = this.visible || Date.now() - this.hiddenAt < WARM_MS;
    if (warm) this.show();
    else this.timer = setTimeout(() => this.show(), SHOW_DELAY_MS);
  }

  private show(): void {
    const anchor = this.anchor;
    if (!anchor?.isConnected) return;
    const tip = this.tip().nativeElement;
    tip.textContent = this.textOf(anchor);
    if (!this.visible) tip.showPopover();
    this.visible = true;

    // Centred above the element; below it if there is no room above; always inside the window
    const rect = anchor.getBoundingClientRect();
    const size = tip.getBoundingClientRect();
    const maxLeft = window.innerWidth - size.width - MARGIN_PX;
    const left = Math.max(
      MARGIN_PX,
      Math.min(rect.left + rect.width / 2 - size.width / 2, maxLeft),
    );
    const above = rect.top - GAP_PX - size.height;
    const top = above >= MARGIN_PX ? above : rect.bottom + GAP_PX;
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  private hide(): void {
    clearTimeout(this.timer);
    if (!this.visible) return;
    this.tip().nativeElement.hidePopover();
    this.visible = false;
    this.hiddenAt = Date.now();
  }
}
