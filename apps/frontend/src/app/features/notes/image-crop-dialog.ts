import {
  afterNextRender,
  Component,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { ImageCrop } from '@wortomat/shared';
import { centeredCrop } from '../../core/image-crop';
import { I18n } from '../../core/i18n/i18n';

type Corner = 'nw' | 'ne' | 'sw' | 'se';

/** Kleinster Ausschnitt (Anteil der Bildbreite bzw. -höhe). */
const MIN_SIZE = 0.05;

interface Drag {
  pointerId: number;
  /** `null` = Rahmen verschieben, sonst an dieser Ecke ziehen. */
  corner: Corner | null;
  startX: number;
  startY: number;
  start: ImageCrop;
}

/**
 * Ausschnitt eines Bilds wählen: ein Rahmen im festen Seitenverhältnis, der sich verschieben
 * und an den Ecken vergrößern lässt. Das Bild selbst bleibt unverändert.
 */
@Component({
  selector: 'wm-image-crop-dialog',
  template: `
    <dialog
      #dialog
      aria-labelledby="crop-title"
      (cancel)="$event.preventDefault(); cancelled.emit()"
    >
      <h2 id="crop-title">{{ t().gallery.cropTitle }}</h2>
      <p id="crop-hint" class="hint">{{ t().gallery.cropHint }}</p>

      <div #stage class="stage">
        <img [src]="url()" alt="" draggable="false" (load)="onLoad($any($event.target))" />
        @if (crop(); as c) {
          <div
            class="frame"
            tabindex="0"
            [attr.aria-label]="t().gallery.cropFrame"
            aria-describedby="crop-hint"
            [style.left.%]="c.x * 100"
            [style.top.%]="c.y * 100"
            [style.width.%]="c.width * 100"
            [style.height.%]="c.height * 100"
            (pointerdown)="startDrag($event, null)"
            (pointermove)="onDrag($event)"
            (pointerup)="endDrag($event)"
            (pointercancel)="endDrag($event)"
            (keydown)="onKeydown($event)"
          >
            @for (corner of corners; track corner) {
              <span [class]="'handle ' + corner" (pointerdown)="startDrag($event, corner)"></span>
            }
          </div>
        }
      </div>

      <footer>
        <button type="button" class="reset" (click)="applied.emit(null)">
          {{ t().gallery.cropReset }}
        </button>
        <span class="spacer"></span>
        <button type="button" (click)="cancelled.emit()">{{ t().confirm.cancel }}</button>
        <button type="button" class="primary" [disabled]="!crop()" (click)="applied.emit(crop())">
          {{ t().gallery.cropApply }}
        </button>
      </footer>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(48rem, calc(100vw - 2rem));
      padding: 1.25rem 1.5rem;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      background: var(--bg);
      color: var(--text);
      box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);

      &::backdrop {
        background: rgb(0 0 0 / 0.45);
      }
    }

    h2 {
      margin: 0;
      font-family: var(--font-prose);
      font-weight: 400;
      font-size: 1.35rem;
    }

    .hint {
      margin: 0.35rem 0 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    // Das Bild bestimmt die Größe; der Rahmen liegt in Prozent darüber
    .stage {
      position: relative;
      width: fit-content;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 0.4rem;
      user-select: none;
      touch-action: none;

      img {
        display: block;
        max-width: 100%;
        max-height: 60vh;
      }
    }

    .frame {
      position: absolute;
      box-sizing: border-box;
      border: 2px solid var(--accent);
      // Außerhalb des Ausschnitts abdunkeln
      box-shadow: 0 0 0 100vmax rgb(0 0 0 / 0.55);
      cursor: move;

      &:focus-visible {
        outline: 2px solid var(--bg);
        outline-offset: -4px;
      }
    }

    .handle {
      position: absolute;
      width: 0.9rem;
      height: 0.9rem;
      border: 2px solid var(--accent);
      border-radius: 50%;
      background: var(--bg);

      &.nw {
        top: -0.5rem;
        left: -0.5rem;
        cursor: nwse-resize;
      }

      &.ne {
        top: -0.5rem;
        right: -0.5rem;
        cursor: nesw-resize;
      }

      &.sw {
        bottom: -0.5rem;
        left: -0.5rem;
        cursor: nesw-resize;
      }

      &.se {
        bottom: -0.5rem;
        right: -0.5rem;
        cursor: nwse-resize;
      }
    }

    footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.25rem;
    }

    .spacer {
      flex: 1;
    }
  `,
})
export class ImageCropDialog {
  readonly url = input.required<string>();
  /** Bisheriger Ausschnitt; `null` = noch keiner (Start: größter mittiger Ausschnitt). */
  readonly initial = input<ImageCrop | null>(null);
  /** Seitenverhältnis des Ausschnitts in Bildpixeln (Breite / Höhe). */
  readonly aspect = input.required<number>();
  /** Gewählter Ausschnitt; `null` = ganzes Bild zeigen. */
  readonly applied = output<ImageCrop | null>();
  readonly cancelled = output<void>();

  protected readonly t = inject(I18n).t;
  protected readonly corners: readonly Corner[] = ['nw', 'ne', 'sw', 'se'];
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly stage = viewChild.required<ElementRef<HTMLElement>>('stage');

  protected readonly crop = signal<ImageCrop | null>(null);
  /** Bildmaße in Pixeln – für das Seitenverhältnis des Rahmens. */
  private imageWidth = 1;
  private imageHeight = 1;
  private drag: Drag | null = null;

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected onLoad(image: HTMLImageElement): void {
    this.imageWidth = image.naturalWidth || 1;
    this.imageHeight = image.naturalHeight || 1;
    this.crop.set(this.initial() ?? centeredCrop(this.aspect(), this.imageWidth, this.imageHeight));
  }

  /** Höhe (Anteil) zu einer Breite (Anteil), passend zum Seitenverhältnis. */
  private heightFor(width: number): number {
    return (width * this.imageWidth) / (this.imageHeight * this.aspect());
  }

  private widthFor(height: number): number {
    return (height * this.imageHeight * this.aspect()) / this.imageWidth;
  }

  protected startDrag(event: PointerEvent, corner: Corner | null): void {
    const crop = this.crop();
    if (event.button !== 0 || !crop) return;
    event.preventDefault();
    event.stopPropagation(); // Ecke: nicht zusätzlich verschieben
    // Der Rahmen fängt den Zeiger – auch wenn an einer Ecke angefasst wurde
    (event.currentTarget as Element).closest('.frame')?.setPointerCapture(event.pointerId);
    this.drag = {
      pointerId: event.pointerId,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      start: crop,
    };
  }

  protected onDrag(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = this.stage().nativeElement.getBoundingClientRect();
    const dx = (event.clientX - drag.startX) / rect.width;
    const dy = (event.clientY - drag.startY) / rect.height;
    const { start } = drag;
    if (!drag.corner) {
      this.crop.set({
        ...start,
        x: clamp(start.x + dx, 0, 1 - start.width),
        y: clamp(start.y + dy, 0, 1 - start.height),
      });
      return;
    }
    // Die gegenüberliegende Ecke bleibt stehen
    const west = drag.corner.includes('w');
    const north = drag.corner.includes('n');
    const anchorX = west ? start.x + start.width : start.x;
    const anchorY = north ? start.y + start.height : start.y;
    const pointerX = (west ? start.x : start.x + start.width) + dx;
    const pointerY = (north ? start.y : start.y + start.height) + dy;
    // Die größere der beiden Richtungen bestimmt die Größe
    let width = Math.max(Math.abs(pointerX - anchorX), this.widthFor(Math.abs(pointerY - anchorY)));
    const maxWidth = Math.min(
      west ? anchorX : 1 - anchorX,
      this.widthFor(north ? anchorY : 1 - anchorY),
    );
    width = clamp(width, Math.min(MIN_SIZE, maxWidth), maxWidth);
    const height = this.heightFor(width);
    this.crop.set({
      x: west ? anchorX - width : anchorX,
      y: north ? anchorY - height : anchorY,
      width,
      height,
    });
  }

  protected endDrag(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) this.drag = null;
  }

  /** Pfeiltasten verschieben, + / − vergrößern bzw. verkleinern (um die Mitte). */
  protected onKeydown(event: KeyboardEvent): void {
    const crop = this.crop();
    if (!crop) return;
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      this.crop.set({
        ...crop,
        x: clamp(crop.x + move[0], 0, 1 - crop.width),
        y: clamp(crop.y + move[1], 0, 1 - crop.height),
      });
    } else if (event.key === '+' || event.key === '-') {
      const factor = event.key === '+' ? 1.1 : 1 / 1.1;
      const maxWidth = Math.min(1, this.widthFor(1));
      const width = clamp(crop.width * factor, Math.min(MIN_SIZE, maxWidth), maxWidth);
      const height = this.heightFor(width);
      this.crop.set({
        x: clamp(crop.x + (crop.width - width) / 2, 0, 1 - width),
        y: clamp(crop.y + (crop.height - height) / 2, 0, 1 - height),
        width,
        height,
      });
    } else {
      return;
    }
    event.preventDefault();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
