import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { PlaceMap } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { StatusMessages } from '../../core/status-messages';
import { WortomatApi } from '../../core/wortomat-api';
import { MapPreview } from './map-preview';
import { MapsStore } from './maps-store';

/** "Location" on a place's page: the maps it is placed on. */
@Component({
  selector: 'wm-note-location',
  imports: [RouterLink, MapPreview],
  template: `
    @if (maps(); as list) {
      @if (list.length) {
        <span class="label">{{ t().maps.location }}</span>
        @for (map of list; track map.id) {
          <a
            class="preview"
            [routerLink]="['/write/places/maps', map.id]"
            [queryParams]="{ place: noteId() }"
            [title]="t().maps.showOnMap(map.name)"
          >
            <wm-map-preview [map]="map" [noteId]="noteId()" />
            <span class="name">{{ map.name }}</span>
          </a>
        }
      } @else if (store.maps().length) {
        <span class="label">{{ t().maps.location }}</span>
        <p class="muted none">
          {{ t().maps.notOnMap }}
          @for (map of store.maps(); track map.id) {
            <a [routerLink]="['/write/places/maps', map.id]" [queryParams]="{ place: noteId() }">{{
              map.name
            }}</a
            >{{ $last ? '' : ', ' }}
          }
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.4rem;
      font-size: 0.82rem;
    }

    .label {
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .preview {
      display: grid;
      gap: 0.2rem;
      color: inherit;
      text-decoration: none;

      &:hover .name {
        text-decoration: underline;
      }

      &:hover wm-map-preview {
        filter: brightness(0.97);
      }
    }

    .name {
      color: var(--accent-strong);
    }

    .none {
      margin: 0;
      font-style: italic;

      a {
        color: var(--accent-strong);
        font-style: normal;
      }
    }
  `,
})
export class NoteLocation {
  readonly noteId = input.required<string>();

  protected readonly t = inject(I18n).t;
  protected readonly store = inject(MapsStore);
  private readonly api = inject(WortomatApi);
  private readonly error = inject(StatusMessages).channel();
  protected readonly maps = signal<PlaceMap[] | null>(null);
  private loadCounter = 0;

  constructor() {
    effect(() => {
      const noteId = this.noteId();
      untracked(() => void this.load(noteId));
    });
  }

  private async load(noteId: string): Promise<void> {
    const loadId = ++this.loadCounter;
    this.maps.set(null);
    this.error.set(null);
    try {
      const maps = await this.api.mapsWithPlace(noteId);
      if (loadId === this.loadCounter) this.maps.set(maps);
    } catch (error) {
      if (loadId === this.loadCounter) this.error.set(errorMessage(error, this.t()));
    }
  }
}
