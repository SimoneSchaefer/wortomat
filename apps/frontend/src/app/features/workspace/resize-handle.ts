import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';

const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

/**
 * Senkrechter Griff zum Ändern einer Breite (WAI-ARIA „Window Splitter“):
 * ziehen mit der Maus, ← → mit der Tastatur (mit Umschalt in großen Schritten),
 * Pos1/Ende für Minimum/Maximum, Doppelklick setzt auf den Standard zurück.
 */
@Component({
  selector: 'wm-resize-handle',
  template: '',
  styleUrl: './resize-handle.scss',
  host: {
    role: 'separator',
    tabindex: '0',
    'aria-orientation': 'vertical',
    '[attr.aria-label]': 'label()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.title]': 't().workspace.resizeHint',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKeydown($event)',
    '(dblclick)': 'reset.emit()',
    '[class.dragging]': 'dragging()',
  },
})
export class ResizeHandle {
  readonly value = input.required<number>();
  readonly min = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input.required<string>();

  /** Neue Breite (bereits auf min/max begrenzt). */
  readonly resized = output<number>();
  readonly reset = output<void>();

  protected readonly t = inject(I18n).t;
  protected readonly dragging = signal(false);
  private stopDragging: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopDragging?.());
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault(); // keine Textauswahl beim Ziehen
    const startX = event.clientX;
    const startValue = this.value();

    const onMove = (move: PointerEvent) => this.emit(startValue + move.clientX - startX);
    const stop = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
      document.body.classList.remove('wm-resizing');
      this.dragging.set(false);
      this.stopDragging = null;
    };
    // Am Dokument lauschen, damit das Ziehen auch über dem Editor weiterläuft.
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
    document.body.classList.add('wm-resizing');
    this.dragging.set(true);
    this.stopDragging = stop;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    const target =
      event.key === 'ArrowLeft'
        ? this.value() - step
        : event.key === 'ArrowRight'
          ? this.value() + step
          : event.key === 'Home'
            ? this.min()
            : event.key === 'End'
              ? this.max()
              : null;
    if (target === null) return;
    event.preventDefault();
    this.emit(target);
  }

  private emit(width: number): void {
    this.resized.emit(Math.round(Math.min(this.max(), Math.max(this.min(), width))));
  }
}
