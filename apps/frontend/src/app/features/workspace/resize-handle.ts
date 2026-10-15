import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';

const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

/**
 * Vertical handle for changing a width (WAI-ARIA "window splitter"): drag with the mouse, ← → with
 * the keyboard (with Shift in large steps), Home/End for minimum/maximum, double-click resets to
 * the default.
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

  /** Already clamped to min/max. */
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
    event.preventDefault(); // no text selection while dragging
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
    // Listen on the document so dragging continues over the editor.
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
