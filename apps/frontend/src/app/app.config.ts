import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { AppSettingsStore } from './core/app-settings';
import { Appearance } from './core/appearance';
import { I18n, languageInterceptor } from './core/i18n/i18n';
import { StatusErrorHandler } from './core/status-messages';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Unerwartete Fehler auch in der Statusleiste zeigen, nicht nur in der Konsole
    { provide: ErrorHandler, useClass: StatusErrorHandler },
    provideHttpClient(withFetch(), withInterceptors([languageInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    // Einstellungen vor dem ersten Rendern laden, damit z. B. Sprache und Seitenleiste stimmen.
    provideAppInitializer(() => {
      inject(I18n); // setzt <html lang> und meldet die Sprache an Electron
      inject(Appearance); // Farbschema und Schriftgröße
      return inject(AppSettingsStore).load();
    }),
  ],
};
