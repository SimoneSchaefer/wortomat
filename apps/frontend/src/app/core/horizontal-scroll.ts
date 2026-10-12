import { afterNextRender, DestroyRef, Directive, ElementRef, inject, signal } from '@angular/core';

/** So weit springt ein kurzer Klick auf einen Pfeil (Anteil der sichtbaren Breite). */
const STEP_RATIO = 0.6;
/** Ab dieser Druckdauer wird fortlaufend gescrollt … */
const HOLD_DELAY_MS = 300;
/** … mit dieser Geschwindigkeit. */
const HOLD_SPEED_PX_PER_S = 500;

/**
 * Seitlich scrollbare Zeile ohne sichtbare Scrollleiste. Meldet, ob es links bzw. rechts
 * noch etwas zu sehen gibt (für Pfeil-Buttons), und scrollt per Klick, Gedrückthalten
 * oder Mausrad. Tastatur: Fokus auf einen Eintrag scrollt ihn wie gewohnt ins Bild.
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
    // Breite der Zeile oder ihr Inhalt ändert sich → Pfeile neu bestimmen
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
   * Für `pointerdown` auf einem Pfeil: sofort ein Stück, nach kurzem Halten fortlaufend –
   * bis die Maus losgelassen wird oder das Ende erreicht ist.
   */
  start(direction: -1 | 1, event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault(); // kein Fokus, keine Textauswahl
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
   * Mausrad über einer überlaufenden Zeile scrollt seitlich. Am Anfang bzw. Ende der Zeile
   * scrollt wieder die Seite, damit man nicht „hängen bleibt“.
   */
  protected onWheel(event: WheelEvent): void {
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return; // Touchpad: schon seitlich
    const more = event.deltaY < 0 ? this.canScrollLeft() : this.canScrollRight();
    if (!more) return;
    event.preventDefault();
    this.element.scrollLeft += event.deltaY;
  }
}
