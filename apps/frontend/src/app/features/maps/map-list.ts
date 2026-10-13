import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { MapSummary } from '@wortomat/shared';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { StatusMessages } from '../../core/status-messages';
import { MapsStore } from './maps-store';

/** Karten über der Liste der Orte – eine Karte wie eine Gruppe, darin die Karten. */
@Component({
  selector: 'wm-map-list',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './map-list.html',
  styleUrl: './map-list.scss',
})
export class MapList {
  protected readonly t = inject(I18n).t;
  protected readonly store = inject(MapsStore);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialog);
  private readonly error = inject(StatusMessages).channel();

  protected async add(): Promise<void> {
    this.error.set(null);
    try {
      const map = await this.store.create(this.t().maps.newName);
      await this.router.navigate(['/write/places/maps', map.id]);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  protected async remove(map: MapSummary): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: this.t().maps.deleteTitle,
      message: this.t().maps.deleteMessage(map.name),
      confirmLabel: this.t().confirm.delete,
    });
    if (!confirmed) return;
    this.error.set(null);
    try {
      await this.store.remove(map.id);
      if (this.router.url.endsWith(`/${map.id}`)) {
        await this.router.navigate(['/write/places']);
      }
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
