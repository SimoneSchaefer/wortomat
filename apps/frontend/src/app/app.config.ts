import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withFetch } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import {
  type ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AppSettingsStore } from './core/app-settings';

// Zahlen und Daten im deutschen Format (12.345 statt 12,345).
registerLocaleData(localeDe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'de' },
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding()),
    // Einstellungen vor dem ersten Rendern laden, damit z. B. die Seitenleiste nicht springt.
    provideAppInitializer(() => inject(AppSettingsStore).load()),
  ],
};
