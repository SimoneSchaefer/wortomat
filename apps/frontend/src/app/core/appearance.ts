import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import type { FontSize } from '@wortomat/shared';
import { AppSettingsStore } from './app-settings';
import { DESKTOP_BRIDGE } from './desktop-bridge';

/** Faktor gegenüber „mittel“ – muss zu `data-font-size` in styles.scss passen. */
export const FONT_SCALE: Record<FontSize, number> = { small: 0.875, medium: 1, large: 1.125 };

/**
 * Farbschema und Schriftgröße aus den Einstellungen: als `data-theme` und `data-font-size`
 * an `<html>` (die Farben und Größen dazu stehen in styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class Appearance {
  private readonly settings = inject(AppSettingsStore);

  readonly theme = computed(() => this.settings.settings().theme);
  readonly fontSize = computed(() => this.settings.settings().fontSize);
  /** Für Werte in Pixeln, die mit der Schrift wachsen sollen (z. B. Mindestbreiten). */
  readonly fontScale = computed(() => FONT_SCALE[this.fontSize()]);

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    const desktop = inject(DESKTOP_BRIDGE);
    effect(() => {
      root.dataset['theme'] = this.theme();
      desktop?.setTheme?.(this.theme());
    });
    effect(() => {
      root.dataset['fontSize'] = this.fontSize();
    });
  }
}
