import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type {
  AppSettings,
  FontSize,
  Language,
  QuoteStyle,
  Theme,
  UpdateAppSettingsRequest,
} from '@wortomat/shared';
import { localized } from '../i18n.js';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';

const SETTINGS_FILE = 'settings.json';
export const SIDEBAR_WIDTH_LIMITS = { min: 150, max: 1000 } as const;

const QUOTE_STYLES: readonly QuoteStyle[] = ['de', 'de-guillemets', 'ch', 'en', 'fr', 'off'];

const LANGUAGES: readonly Language[] = ['de', 'en'];
const THEMES: readonly Theme[] = ['system', 'light', 'dark'];
const FONT_SIZES: readonly FontSize[] = ['small', 'medium', 'large'];

const DEFAULTS: AppSettings = {
  language: null,
  sidebarWidth: null,
  quoteStyle: 'de',
  theme: 'system',
  fontSize: 'medium',
};

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
    if (request?.language !== undefined) {
      if (request.language !== null && !isLanguage(request.language)) {
        throw new BadRequestException(
          localized(
            `Unbekannte Sprache: ${String(request.language)}`,
            `Unknown language: ${String(request.language)}`,
          ),
        );
      }
      next.language = request.language;
    }
    if (request?.sidebarWidth !== undefined) {
      next.sidebarWidth = requireSidebarWidth(request.sidebarWidth);
    }
    if (request?.quoteStyle !== undefined) {
      if (!isQuoteStyle(request.quoteStyle)) {
        throw new BadRequestException(
          localized(
            `Unbekannte Anführungszeichen: ${String(request.quoteStyle)}`,
            `Unknown quote style: ${String(request.quoteStyle)}`,
          ),
        );
      }
      next.quoteStyle = request.quoteStyle;
    }
    if (request?.theme !== undefined) {
      if (!THEMES.includes(request.theme)) {
        throw new BadRequestException(
          localized(
            `Unbekanntes Farbschema: ${String(request.theme)}`,
            `Unknown color scheme: ${String(request.theme)}`,
          ),
        );
      }
      next.theme = request.theme;
    }
    if (request?.fontSize !== undefined) {
      if (!FONT_SIZES.includes(request.fontSize)) {
        throw new BadRequestException(
          localized(
            `Unbekannte Schriftgröße: ${String(request.fontSize)}`,
            `Unknown font size: ${String(request.fontSize)}`,
          ),
        );
      }
      next.fontSize = request.fontSize;
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
  if (isLanguage(stored?.language)) result.language = stored.language;
  const width = stored?.sidebarWidth;
  if (isValidWidth(width)) result.sidebarWidth = Math.round(width);
  if (isQuoteStyle(stored?.quoteStyle)) result.quoteStyle = stored.quoteStyle;
  if (THEMES.includes(stored?.theme as Theme)) result.theme = stored.theme;
  if (FONT_SIZES.includes(stored?.fontSize as FontSize)) result.fontSize = stored.fontSize;
  return result;
}

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language);
}

function isQuoteStyle(value: unknown): value is QuoteStyle {
  return QUOTE_STYLES.includes(value as QuoteStyle);
}

function requireSidebarWidth(value: unknown): number | null {
  if (value === null) return null;
  if (!isValidWidth(value)) {
    const { min, max } = SIDEBAR_WIDTH_LIMITS;
    throw new BadRequestException(
      localized(
        `Die Breite muss zwischen ${min} und ${max} Pixeln liegen.`,
        `The width must be between ${min} and ${max} pixels.`,
      ),
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
