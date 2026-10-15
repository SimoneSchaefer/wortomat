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
    // Show unexpected errors in the status bar too, not only in the console
    { provide: ErrorHandler, useClass: StatusErrorHandler },
    provideHttpClient(withFetch(), withInterceptors([languageInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    // Load the settings before the first render so language, sidebar etc. are right.
    provideAppInitializer(() => {
      inject(I18n); // sets <html lang> and reports the language to Electron
      inject(Appearance);
      return inject(AppSettingsStore).load();
    }),
  ],
};
