import { inject, Injectable, signal } from '@angular/core';
import type { MapSummary, PlaceMap } from '@wortomat/shared';
import { WortomatApi } from '../../core/wortomat-api';

/**
 * Only the list; the map page loads drawing and places. Provided in the workspace and therefore
 * created anew on every project switch.
 */
@Injectable()
export class MapsStore {
  private readonly api = inject(WortomatApi);

  readonly maps = signal<MapSummary[]>([]);

  async load(): Promise<void> {
    this.maps.set(await this.api.listMaps());
  }

  find(id: string): MapSummary | undefined {
    return this.maps().find((map) => map.id === id);
  }

  async create(name: string): Promise<MapSummary> {
    const map = summary(await this.api.createMap({ name }));
    this.maps.update((maps) => [...maps, map]);
    return map;
  }

  /** After saving on the map page: update the name in the list. */
  updated(map: PlaceMap): void {
    this.maps.update((maps) => maps.map((entry) => (entry.id === map.id ? summary(map) : entry)));
  }

  async remove(id: string): Promise<void> {
    await this.api.deleteMap(id);
    this.maps.update((maps) => maps.filter((map) => map.id !== id));
  }
}

function summary({ id, name, updatedAt }: MapSummary): MapSummary {
  return { id, name, updatedAt };
}
