import { Component, computed, input, linkedSignal } from '@angular/core';
import type { NoteSummary } from '@wortomat/shared';
import { coverCrop, cropStyle } from '../../core/image-crop';

/** Without an image, the initials ("Anna Berger" → "AB"). */
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

    // Chosen crop: move and scale the image so the crop fills the circle
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
   * Image dimensions – only known after loading, needed for the round crop. Reset only for a
   * different image (via `url`, not on every change to the note): the same image does not load
   * again, so the dimensions would never come back.
   */
  private readonly size = linkedSignal<string | null, { width: number; height: number } | null>({
    source: this.url,
    computation: () => null,
  });

  /** `null` without a crop (whole image, centred). */
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
