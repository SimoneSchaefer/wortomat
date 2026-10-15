import { inject, Injectable, signal } from '@angular/core';
import type {
  AppSettings,
  FontSize,
  Language,
  PlotViewSettings,
  QuoteStyle,
  Theme,
} from '@wortomat/shared';
import { WortomatApi } from './wortomat-api';

const SAVE_DELAY_MS = 400;

/** Stored in the backend. */
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
    revisionMode: false,
    plotView: { order: 'story', onlyTurningPoints: true, compact: false },
  });

  /** Errors are no reason not to start the app – the defaults apply then. */
  async load(): Promise<void> {
    try {
      this.settings.set(await this.api.settings());
    } catch (error) {
      console.warn('Einstellungen konnten nicht geladen werden', error);
    }
  }

  /** Apply right away, save delayed (e.g. for several arrow key steps). */
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

  setRevisionMode(revisionMode: boolean): Promise<void> {
    return this.saveNow('revisionMode', revisionMode);
  }

  /** Apply right away, save in the background. */
  setPlotView(changes: Partial<PlotViewSettings>): void {
    this.settings.update((settings) => ({
      ...settings,
      plotView: { ...settings.plotView, ...changes },
    }));
    this.api
      .updateSettings({ plotView: changes })
      .catch((error: unknown) => console.warn('Einstellungen nicht gespeichert', error));
  }

  /** Apply right away and save; if saving fails, the old value applies again. */
  private async saveNow<K extends Exclude<keyof AppSettings, 'sidebarWidth' | 'plotView'>>(
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
