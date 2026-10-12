import { inject, Injectable, signal } from '@angular/core';
import type { AppSettings, FontSize, Language, QuoteStyle, Theme } from '@wortomat/shared';
import { WortomatApi } from './wortomat-api';

const SAVE_DELAY_MS = 400;

/** App-Einstellungen (z. B. Sprache, Breite der Seitenleiste), gespeichert im Backend. */
@Injectable({ providedIn: 'root' })
export class AppSettingsStore {
  private readonly api = inject(WortomatApi);
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  readonly settings = signal<AppSettings>({
    language: null,
    sidebarWidth: null,
    quoteStyle: 'de',
    theme: 'system',
    fontSize: 'medium',
  });

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

  setLanguage(language: Language): Promise<void> {
    return this.saveNow('language', language);
  }

  setQuoteStyle(quoteStyle: QuoteStyle): Promise<void> {
    return this.saveNow('quoteStyle', quoteStyle);
  }

  setTheme(theme: Theme): Promise<void> {
    return this.saveNow('theme', theme);
  }

  setFontSize(fontSize: FontSize): Promise<void> {
    return this.saveNow('fontSize', fontSize);
  }

  /** Sofort übernehmen und speichern; schlägt das Speichern fehl, gilt wieder der alte Wert. */
  private async saveNow<K extends Exclude<keyof AppSettings, 'sidebarWidth'>>(
    key: K,
    value: AppSettings[K],
  ): Promise<void> {
    const previous = this.settings()[key];
    this.settings.update((settings) => ({ ...settings, [key]: value }));
    try {
      await this.api.updateSettings({ [key]: value });
    } catch (error) {
      this.settings.update((settings) => ({ ...settings, [key]: previous }));
      throw error;
    }
  }
}
