import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { AppSettings, QuoteStyle, UpdateAppSettingsRequest } from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';

const SETTINGS_FILE = 'settings.json';
export const SIDEBAR_WIDTH_LIMITS = { min: 150, max: 1000 } as const;

const QUOTE_STYLES: readonly QuoteStyle[] = ['de', 'de-guillemets', 'ch', 'en', 'fr', 'off'];

const DEFAULTS: AppSettings = { sidebarWidth: null, quoteStyle: 'de' };

/**
 * Einstellungen der App, unabhängig vom geöffneten Buch, als JSON im App-Datenordner.
 * (Nicht im localStorage des Fensters: Electron startet das Backend auf einem zufälligen Port,
 * und localStorage hängt am Origin – er wäre nach jedem Start leer.)
 */
@Injectable()
export class AppSettingsService {
  private readonly logger = new Logger(AppSettingsService.name);
  private readonly file: string;

  constructor(@Inject(SERVER_OPTIONS) options: ServerOptions) {
    this.file = path.join(options.dataDir, SETTINGS_FILE);
  }

  get(): AppSettings {
    if (!existsSync(this.file)) {
      return { ...DEFAULTS };
    }
    try {
      const stored = JSON.parse(readFileSync(this.file, 'utf8')) as Partial<AppSettings>;
      return { ...DEFAULTS, ...sanitize(stored) };
    } catch (error) {
      this.logger.warn(`Einstellungen unlesbar, verwende Standardwerte: ${String(error)}`);
      return { ...DEFAULTS };
    }
  }

  update(request: UpdateAppSettingsRequest): AppSettings {
    const next: AppSettings = { ...this.get() };
    if (request?.sidebarWidth !== undefined) {
      next.sidebarWidth = requireSidebarWidth(request.sidebarWidth);
    }
    if (request?.quoteStyle !== undefined) {
      if (!isQuoteStyle(request.quoteStyle)) {
        throw new BadRequestException(
          `Unbekannte Anführungszeichen: ${String(request.quoteStyle)}`,
        );
      }
      next.quoteStyle = request.quoteStyle;
    }
    mkdirSync(path.dirname(this.file), { recursive: true });
    // Erst in eine Temp-Datei schreiben, dann umbenennen: nie eine halb geschriebene Datei.
    const tmpFile = `${this.file}.tmp`;
    writeFileSync(tmpFile, JSON.stringify(next, null, 2));
    renameSync(tmpFile, this.file);
    return next;
  }
}

/** Unbekannte oder ungültige Werte aus der Datei ignorieren. */
function sanitize(stored: Partial<AppSettings>): Partial<AppSettings> {
  const result: Partial<AppSettings> = {};
  const width = stored?.sidebarWidth;
  if (isValidWidth(width)) result.sidebarWidth = Math.round(width);
  if (isQuoteStyle(stored?.quoteStyle)) result.quoteStyle = stored.quoteStyle;
  return result;
}

function isQuoteStyle(value: unknown): value is QuoteStyle {
  return QUOTE_STYLES.includes(value as QuoteStyle);
}

function requireSidebarWidth(value: unknown): number | null {
  if (value === null) return null;
  if (!isValidWidth(value)) {
    throw new BadRequestException(
      `Die Breite muss zwischen ${SIDEBAR_WIDTH_LIMITS.min} und ${SIDEBAR_WIDTH_LIMITS.max} Pixeln liegen.`,
    );
  }
  return Math.round(value);
}

function isValidWidth(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= SIDEBAR_WIDTH_LIMITS.min &&
    value <= SIDEBAR_WIDTH_LIMITS.max
  );
}
