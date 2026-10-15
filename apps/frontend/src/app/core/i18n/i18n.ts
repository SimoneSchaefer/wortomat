import type { HttpInterceptorFn } from '@angular/common/http';
import { computed, DOCUMENT, effect, inject, Injectable } from '@angular/core';
import type { Language } from '@wortomat/shared';
import { AppSettingsStore } from '../app-settings';
import { DESKTOP_BRIDGE } from '../desktop-bridge';
import { de, type Texts } from './de';
import { en } from './en';

export type { Texts } from './de';

const TEXTS: Record<Language, Texts> = { de, en };

/** For the settings – each named in its own language. */
export const LANGUAGES: ReadonlyArray<{ language: Language; name: string }> = [
  { language: 'de', name: 'Deutsch' },
  { language: 'en', name: 'English' },
];

/** Without a setting: German if the system speaks German, otherwise English. */
export function systemLanguage(languages: readonly string[] = navigator.languages): Language {
  const preferred = languages.find((tag) => /^(de|en)\b/i.test(tag));
  return preferred?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

const IS_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Components read their texts from `t()`, so a change in the settings applies right away, without
 * reloading.
 */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly settings = inject(AppSettingsStore);

  readonly language = computed(() => this.settings.settings().language ?? systemLanguage());
  readonly t = computed(() => TEXTS[this.language()]);

  /** For display, e.g. `shortcut('B')` → "Ctrl+B" or "⌘B". */
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

/** The backend answers (e.g. with error messages) in the UI language. */
export const languageInterceptor: HttpInterceptorFn = (request, next) =>
  next(request.clone({ setHeaders: { 'Accept-Language': inject(I18n).language() } }));
