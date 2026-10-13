import { Component, computed, DestroyRef, ElementRef, inject, input, signal } from '@angular/core';
import type { PlaceMap } from '@wortomat/shared';
import { NotesStore } from '../notes/notes-store';
import { strokePath } from './map-drawing';

/**
 * Kleine, nicht bearbeitbare Ansicht einer Karte – mit einem hervorgehobenen Ort
 * (Nadel und Name); die übrigen Orte erscheinen als Punkte.
 */
@Component({
  selector: 'wm-map-preview',
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + map().width + ' ' + map().height"
      [style.aspect-ratio]="map().width / map().height"
      aria-hidden="true"
    >
      <rect class="paper" [attr.width]="map().width" [attr.height]="map().height" />
      @if (map().backgroundImageId) {
        <image
          [attr.href]="'/api/images/' + map().backgroundImageId"
          [attr.width]="map().width"
          [attr.height]="map().height"
          preserveAspectRatio="none"
          [attr.opacity]="map().backgroundOpacity"
        />
      }
      @for (entry of strokes(); track $index) {
        <path
          [class]="entry.tool"
          [attr.d]="entry.d"
          [attr.stroke]="entry.color"
          [attr.fill]="entry.tool === 'area' ? entry.color : 'none'"
          [attr.stroke-width]="entry.width"
        />
      }
      @for (pin of others(); track pin.noteId) {
        <circle class="other" [attr.cx]="pin.x" [attr.cy]="pin.y" [attr.r]="3 * unit()" />
      }
      @if (pin(); as pin) {
        <g [attr.transform]="'translate(' + pin.x + ' ' + pin.y + ') scale(' + unit() + ')'">
          <path class="marker" d="M0 0c-4-6-7-9-7-13a7 7 0 0 1 14 0c0 4-3 7-7 13z" />
          <circle class="dot" cy="-13" r="2.6" />
          @if (label()) {
            <text y="14">{{ label() }}</text>
          }
        </g>
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--border);
      border-radius: 0.4rem;
    }

    .paper {
      fill: #fbf7ee;
    }

    path {
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    path.area {
      fill-opacity: 0.3;
    }

    .other {
      fill: #8a8178;
    }

    .marker {
      fill: #c0392b;
      stroke: #fff;
      stroke-width: 1.5;
    }

    .dot {
      fill: #fff;
    }

    text {
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 600;
      text-anchor: middle;
      fill: #1f1b17;
      stroke: #fbf7ee;
      stroke-width: 3px;
      stroke-linejoin: round;
      paint-order: stroke;
    }
  `,
})
export class MapPreview {
  readonly map = input.required<PlaceMap>();
  /** Der hervorgehobene Ort. */
  readonly noteId = input.required<string>();

  private readonly notes = inject(NotesStore);

  /** Karteneinheiten je Bildschirmpixel, damit Nadel und Schrift lesbar groß bleiben. */
  protected readonly unit = signal(1);

  protected readonly strokes = computed(() =>
    this.map().strokes.map((stroke) => ({
      ...stroke,
      d: strokePath(stroke.points, stroke.tool === 'area'),
    })),
  );
  protected readonly pin = computed(() =>
    this.map().pins.find((pin) => pin.noteId === this.noteId()),
  );
  protected readonly others = computed(() =>
    this.map().pins.filter((pin) => pin.noteId !== this.noteId() && this.notes.find(pin.noteId)),
  );
  protected readonly label = computed(() => this.notes.find(this.noteId())?.title ?? '');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const resize = new ResizeObserver(() => {
      const width = host.getBoundingClientRect().width;
      if (width > 0) this.unit.set(this.map().width / width);
    });
    resize.observe(host);
    inject(DestroyRef).onDestroy(() => resize.disconnect());
  }
}
