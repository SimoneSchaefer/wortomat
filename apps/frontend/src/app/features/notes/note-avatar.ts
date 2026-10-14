import { Component, computed, input, linkedSignal } from '@angular/core';
import type { NoteSummary } from '@wortomat/shared';
import { coverCrop, cropStyle } from '../../core/image-crop';

/** Rundes Profilbild einer Notiz; ohne Bild die Initialen („Anna Berger“ → „AB“). */
@Component({
  selector: 'wm-note-avatar',
  template: `
    @if (note().coverImageUrl; as url) {
      <img
        [src]="url"
        alt=""
        [class.cropped]="!!cropped()"
        [style]="cropped()"
        (load)="onLoad($any($event.target))"
      />
    } @else {
      {{ initials() }}
    }
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      place-items: center;
      flex-shrink: 0;
      width: var(--avatar-size, 2.25rem);
      height: var(--avatar-size, 2.25rem);
      overflow: hidden;
      border-radius: 50%;
      background: var(--hover);
      color: var(--text-muted);
      font-size: calc(var(--avatar-size, 2.25rem) * 0.34);
      font-weight: 600;
      line-height: 1;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    // Gewählter Ausschnitt: das Bild so verschieben und vergrößern, dass er den Kreis füllt
    img.cropped {
      position: absolute;
      max-width: none;
      object-fit: fill;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class NoteAvatar {
  readonly note = input.required<NoteSummary>();

  private readonly url = computed(() => this.note().coverImageUrl);
  /**
   * Bildmaße – erst nach dem Laden bekannt, nötig für den runden Ausschnitt. Nur bei einem
   * anderen Bild zurücksetzen (über `url`, nicht bei jeder Änderung der Notiz): dasselbe
   * Bild lädt nicht neu, die Maße kämen sonst nie wieder.
   */
  private readonly size = linkedSignal<string | null, { width: number; height: number } | null>({
    source: this.url,
    computation: () => null,
  });

  /** Lage des Bilds, wenn ein Ausschnitt gewählt ist; sonst `null` (ganzes Bild, mittig). */
  protected readonly cropped = computed(() => {
    const crop = this.note().coverCrop;
    const size = this.size();
    if (!crop || !size) return null;
    return cropStyle(coverCrop(crop, size.width, size.height, 1));
  });

  protected onLoad(image: HTMLImageElement): void {
    this.size.set({ width: image.naturalWidth, height: image.naturalHeight });
  }

  protected readonly initials = computed(() => {
    const words = this.note().title.trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });
}
