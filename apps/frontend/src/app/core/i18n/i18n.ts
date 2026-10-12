import type { HttpInterceptorFn } from '@angular/common/http';
import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import type { Language } from '@wortomat/shared';
import { AppSettingsStore } from '../app-settings';
import { DESKTOP_BRIDGE } from '../desktop-bridge';
import { de, type Texts } from './de';
import { en } from './en';

export type { Texts } from './de';

const TEXTS: Record<Language, Texts> = { de, en };

/** Zur Auswahl in den Einstellungen – jeweils in der eigenen Sprache benannt. */
export const LANGUAGES: ReadonlyArray<{ language: Language; name: string }> = [
  { language: 'de', name: 'Deutsch' },
  { language: 'en', name: 'English' },
];

/** Ohne Einstellung: Deutsch, wenn das System Deutsch spricht, sonst Englisch. */
export function systemLanguage(languages: readonly string[] = navigator.languages): Language {
  const preferred = languages.find((tag) => /^(de|en)\b/i.test(tag));
  return preferred?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Sprache der Oberfläche. Komponenten lesen ihre Texte aus `t()` – ein Wechsel in den
 * Einstellungen wirkt sofort, ohne Neuladen.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly settings = inject(AppSettingsStore);

  readonly language = computed(() => this.settings.settings().language ?? systemLanguage());
  readonly t = computed(() => TEXTS[this.language()]);

  /** Tastenkürzel zum Anzeigen, z. B. `shortcut('B')` → „Strg+B“ bzw. „⌘B“. */
  readonly shortcut = computed(() => {
    const { ctrl, shift } = this.t().keys;
    return (key: string, options: { shift?: boolean; alt?: boolean } = {}) =>
      IS_MAC
        ? `${options.alt ? '⌥' : ''}${options.shift ? '⇧' : ''}⌘${key}`
        : [ctrl, options.alt && 'Alt', options.shift && shift, key].filter(Boolean).join('+');
  });

  constructor() {
    const document = inject(DOCUMENT);
    const desktop = inject(DESKTOP_BRIDGE);
    effect(() => {
      const language = this.language();
      document.documentElement.lang = language;
      desktop?.setLanguage?.(language);
    });
  }
}

/** Das Backend antwortet (z. B. mit Fehlermeldungen) in der Sprache der Oberfläche. */
export const languageInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { 'Accept-Language': inject(I18n).language() } }));
