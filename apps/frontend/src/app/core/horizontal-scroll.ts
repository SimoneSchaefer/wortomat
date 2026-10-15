import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

/** How far a short click on an arrow jumps (share of the visible width). */
const STEP_RATIO = 0.6;
/** After pressing this long, scrolling continues … */
const HOLD_DELAY_MS = 300;
/** … at this speed. */
const HOLD_SPEED_PX_PER_S = 500;

/**
 * Horizontally scrollable row without a visible scrollbar. Reports whether there is more to see
 * left or right (for arrow buttons) and scrolls by click, hold or mouse wheel. Keyboard: focusing
 * an entry scrolls it into view as usual.
 */
@Directive({
  selector: '[wmHorizontalScroll]',
  exportAs: 'horizontalScroll',
  host: {
    '(scroll)': 'update()',
    '(wheel)': 'onWheel($event)',
  },
})
export class HorizontalScroll {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly canScrollLeft = signal(false);
  readonly canScrollRight = signal(false);

  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private frame: number | undefined;

  constructor() {
    // Width of the row or its content changes → recompute the arrows
    const resize = new ResizeObserver(() => this.update());
    const mutation = new MutationObserver(() => this.update());
    afterNextRender(() => {
      resize.observe(this.element);
      mutation.observe(this.element, { childList: true, subtree: true, characterData: true });
      this.update();
    });
    inject(DestroyRef).onDestroy(() => {
      resize.disconnect();
      mutation.disconnect();
      this.stop();
    });
  }

  update(): void {
    const { scrollLeft, scrollWidth, clientWidth } = this.element;
    this.canScrollLeft.set(scrollLeft > 1);
    this.canScrollRight.set(scrollLeft < scrollWidth - clientWidth - 1);
  }

  /**
   * For `pointerdown` on an arrow: one step right away, continuously after a short hold – until the
   * mouse is released or the end is reached.
   */
  start(direction: -1 | 1, event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault(); // no focus, no text selection
    this.stop();
    this.element.scrollBy({
      left: direction * this.element.clientWidth * STEP_RATIO,
      behavior: 'smooth',
    });
    window.addEventListener('pointerup', this.stop, { once: true });
    window.addEventListener('pointercancel', this.stop, { once: true });
    this.holdTimer = setTimeout(() => {
      let last = performance.now();
      const tick = (now: number) => {
        this.element.scrollLeft += (direction * HOLD_SPEED_PX_PER_S * (now - last)) / 1000;
        last = now;
        this.update();
        const more = direction < 0 ? this.canScrollLeft() : this.canScrollRight();
        this.frame = more ? requestAnimationFrame(tick) : undefined;
      };
      this.frame = requestAnimationFrame(tick);
    }, HOLD_DELAY_MS);
  }

  readonly stop = (): void => {
    clearTimeout(this.holdTimer);
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
    this.frame = undefined;
    window.removeEventListener('pointerup', this.stop);
    window.removeEventListener('pointercancel', this.stop);
  };

  /**
   * The mouse wheel over an overflowing row scrolls sideways. At the start or end of the row the
   * page scrolls again, so you do not get stuck.
   */
  protected onWheel(event: WheelEvent): void {
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return; // touchpad: already sideways
    const more = event.deltaY < 0 ? this.canScrollLeft() : this.canScrollRight();
    if (!more) return;
    event.preventDefault();
    this.element.scrollLeft += event.deltaY;
  }
}
