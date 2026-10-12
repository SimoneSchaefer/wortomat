import { HttpErrorResponse } from '@angular/common/http';
import type { Texts } from './i18n/i18n';

/** Macht aus einem Fehler (meist eine NestJS-Fehlerantwort) eine lesbare Meldung. */
export function errorMessage(error: unknown, t: Texts): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return t.errors.backendUnreachable;
    }
    const message: unknown = error.error?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
    return t.errors.status(error.status);
  }
  return error instanceof Error ? error.message : String(error);
}
