import { inject, Injectable, signal } from '@angular/core';
import type { AppSettings } from '@wortomat/shared';
import { WortomatApi } from './wortomat-api';

const SAVE_DELAY_MS = 400;

/** App-Einstellungen (z. B. Breite der Seitenleiste), gespeichert im Backend. */
@Injectable({ providedIn: 'root' })
export class AppSettingsStore {
  private readonly api = inject(WortomatApi);
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  readonly settings = signal<AppSettings>({ sidebarWidth: null });

  /** Fehler sind hier kein Grund, die App nicht zu starten – dann gelten die Standardwerte. */
  async load(): Promise<void> {
    try {
      this.settings.set(await this.api.settings());
    } catch (error) {
      console.warn('Einstellungen konnten nicht geladen werden', error);
    }
  }

  /** Sofort übernehmen, verzögert speichern (z. B. bei mehreren Pfeiltasten-Schritten). */
  setSidebarWidth(width: number | null): void {
    this.settings.update((settings) => ({ ...settings, sidebarWidth: width }));
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.api
        .updateSettings({ sidebarWidth: width })
        .catch((error: unknown) => console.warn('Einstellungen nicht gespeichert', error));
    }, SAVE_DELAY_MS);
  }
}
