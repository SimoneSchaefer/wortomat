import { Component, computed, input } from '@angular/core';
import { COVER_PALETTES } from '../../core/cover-design';

/**
 * Portrait format (1 : 1.6). Without an image, a plain fallback cover from title and author whose
 * colours belong to the book for good (derived from the file path). The font grows with the width –
 * the cover works large as well as as a thumbnail.
 */
@Component({
  selector: 'wm-book-cover',
  template: `
    @if (url(); as src) {
      <img [src]="src" alt="" />
    } @else {
      <span class="frame">
        <span class="title">{{ title() }}</span>
        <span class="rule"></span>
        @if (author()) {
          <span class="author">{{ author() }}</span>
        }
      </span>
    }
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      container-type: inline-size;
      aspect-ratio: 1 / 1.6;
      overflow: hidden;
      border-radius: 0.2rem 0.35rem 0.35rem 0.2rem;
      background: var(--cover-background);
      color: var(--cover-text);
      box-shadow:
        inset 3px 0 0 rgb(0 0 0 / 0.12),
        0 2px 6px rgb(0 0 0 / 0.18);
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .frame {
      position: absolute;
      inset: 5cqi;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18cqi 6cqi 10cqi;
      border: max(1px, 0.4cqi) solid var(--cover-accent);
      text-align: center;
    }

    .title {
      display: -webkit-box;
      -webkit-line-clamp: 5;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-family: var(--font-prose);
      font-size: 11cqi;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }

    .rule {
      flex: none;
      width: 16cqi;
      height: max(1px, 0.5cqi);
      margin-top: 7cqi;
      background: var(--cover-accent);
    }

    .author {
      margin-top: auto;
      font-family: var(--font-prose);
      font-style: italic;
      font-size: 6.5cqi;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
  `,
  host: {
    'aria-hidden': 'true',
    '[style.--cover-background]': 'palette().background',
    '[style.--cover-text]': 'palette().text',
    '[style.--cover-accent]': 'palette().accent',
  },
})
export class BookCover {
  readonly url = input<string | null>(null);
  readonly title = input.required<string>();
  readonly author = input('');
  /** So every book always looks the same. */
  readonly seed = input('');

  protected readonly palette = computed(() => {
    let hash = 0;
    for (const char of this.seed() || this.title()) {
      hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return COVER_PALETTES[Math.abs(hash) % COVER_PALETTES.length]!;
  });
}
