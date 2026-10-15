import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import type { FontSize } from '@wortomat/shared';
import { AppSettingsStore } from './app-settings';
import { DESKTOP_BRIDGE } from './desktop-bridge';

/** Factor relative to medium – must match `data-font-size` in styles.scss. */
export const FONT_SCALE: Record<FontSize, number> = { small: 0.875, medium: 1, large: 1.125 };

/**
 * Set as `data-theme` and `data-font-size` on `<html>` (the colours and sizes live in styles.scss).
 */
@Injectable({ providedIn: 'root' })
export class Appearance {
  private readonly settings = inject(AppSettingsStore);

  readonly theme = computed(() => this.settings.settings().theme);
  readonly fontSize = computed(() => this.settings.settings().fontSize);
  /** For pixel values that should grow with the font (e.g. minimum widths). */
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
