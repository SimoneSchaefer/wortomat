import { HttpErrorResponse } from '@angular/common/http';

/** Macht aus einem Fehler (meist eine NestJS-Fehlerantwort) eine lesbare Meldung. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }
    const message: unknown = error.error?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
    return `Fehler ${error.status}`;
  }
  return error instanceof Error ? error.message : String(error);
}
