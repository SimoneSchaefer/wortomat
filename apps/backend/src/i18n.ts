import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  type HttpServer,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Language } from '@wortomat/shared';
import type { Request, Response } from 'express';

/**
 * Meldung in allen Sprachen der Oberfläche. Ausgewählt wird erst beim Antworten – nach
 * `Accept-Language`, das das Frontend mit der eingestellten Sprache schickt.
 */
export type Localized = Readonly<Record<Language, string>>;

export function localized(de: string, en: string): Localized {
  return { de, en };
}

export function isLocalized(value: unknown): value is Localized {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Localized).de === 'string' &&
    typeof (value as Localized).en === 'string'
  );
}

/** Fehler mit übersetzbarer Meldung (`message` ist die deutsche, z. B. fürs Log). */
export class LocalizedError extends Error {
  constructor(readonly text: Localized) {
    super(text.de);
  }
}

/** Erste Sprache aus `Accept-Language`, die wir kennen; ohne Angabe Deutsch. */
export function requestLanguage(req: Pick<Request, 'headers'>): Language {
  const header = req.headers['accept-language'] ?? '';
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]!.trim().toLowerCase();
    if (tag.startsWith('de')) return 'de';
    if (tag.startsWith('en')) return 'en';
  }
  return 'de';
}

/**
 * `throw new BadRequestException(localized('…', '…'))` → `{ statusCode, message }` in der
 * Sprache der Anfrage. Alle anderen Fehler behandelt Nest wie gewohnt.
 */
@Catch()
export class LocalizedExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor(httpAdapter: HttpServer) {
    super(httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    const body = exception instanceof HttpException ? exception.getResponse() : null;
    if (!(exception instanceof HttpException) || !isLocalized(body)) {
      super.catch(exception, host);
      return;
    }
    const http = host.switchToHttp();
    const status = exception.getStatus();
    http
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, message: body[requestLanguage(http.getRequest<Request>())] });
  }
}
