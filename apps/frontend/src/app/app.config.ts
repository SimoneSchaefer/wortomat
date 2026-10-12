import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AppSettingsStore } from './core/app-settings';
import { I18n, languageInterceptor } from './core/i18n/i18n';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([languageInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    // Einstellungen vor dem ersten Rendern laden, damit z. B. Sprache und Seitenleiste stimmen.
    provideAppInitializer(() => {
      inject(I18n); // setzt <html lang> und meldet die Sprache an Electron
      return inject(AppSettingsStore).load();
    }),
  ],
};
