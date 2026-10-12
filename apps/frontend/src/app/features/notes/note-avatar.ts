import { Component, computed, input } from '@angular/core';
import type { NoteSummary } from '@wortomat/shared';

/** Rundes Profilbild einer Notiz; ohne Bild die Initialen („Anna Berger“ → „AB“). */
@Component({
  selector: 'wm-note-avatar',
  template: `
    @if (note().coverImageUrl; as url) {
      <img [src]="url" alt="" />
    } @else {
      {{ initials() }}
    }
  `,
  styles: `
    :host {
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
  `,
  host: { 'aria-hidden': 'true' },
})
export class NoteAvatar {
  readonly note = input.required<NoteSummary>();

  protected readonly initials = computed(() => {
    const words = this.note().title.trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  });
}
