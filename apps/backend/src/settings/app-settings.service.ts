import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type {
  AppSettings,
  FontSize,
  Language,
  PlotViewSettings,
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
  revisionMode: false,
  plotView: { order: 'story', onlyTurningPoints: true, compact: false },
};

/**
 * Independent of the open book, stored as JSON in the app data folder. (Not in the window's
 * localStorage: Electron starts the backend on a random port, and localStorage is tied to the
 * origin – it would be empty after every start.)
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
    if (request?.revisionMode !== undefined) {
      if (typeof request.revisionMode !== 'boolean') {
        throw new BadRequestException(
          localized(
            'Der Überarbeitungsmodus ist entweder an oder aus.',
            'The revision mode is either on or off.',
          ),
        );
      }
      next.revisionMode = request.revisionMode;
    }
    if (request?.plotView !== undefined) {
      const plotView = { ...next.plotView, ...request.plotView };
      if (!isPlotView(plotView)) {
        throw new BadRequestException(
          localized('Ungültige Einstellung der Handlung.', 'Invalid plot view setting.'),
        );
      }
      next.plotView = {
        order: plotView.order,
        onlyTurningPoints: plotView.onlyTurningPoints,
        compact: plotView.compact,
      };
    }
    mkdirSync(path.dirname(this.file), { recursive: true });
    // Write to a temp file first, then rename: never a half-written file.
    const tmpFile = `${this.file}.tmp`;
    writeFileSync(tmpFile, JSON.stringify(next, null, 2));
    renameSync(tmpFile, this.file);
    return next;
  }
}

/** Ignores unknown or invalid values from the file. */
function sanitize(stored: Partial<AppSettings>): Partial<AppSettings> {
  const result: Partial<AppSettings> = {};
  if (isLanguage(stored?.language)) result.language = stored.language;
  const width = stored?.sidebarWidth;
  if (isValidWidth(width)) result.sidebarWidth = Math.round(width);
  if (isQuoteStyle(stored?.quoteStyle)) result.quoteStyle = stored.quoteStyle;
  if (THEMES.includes(stored?.theme as Theme)) result.theme = stored.theme;
  if (FONT_SIZES.includes(stored?.fontSize as FontSize)) result.fontSize = stored.fontSize;
  if (typeof stored?.revisionMode === 'boolean') result.revisionMode = stored.revisionMode;
  // Replace single broken values with the default instead of discarding the whole view
  const plotView: Partial<PlotViewSettings> = stored?.plotView ?? {};
  const fallback = DEFAULTS.plotView;
  result.plotView = {
    order:
      plotView.order === 'story' || plotView.order === 'book' ? plotView.order : fallback.order,
    onlyTurningPoints:
      typeof plotView.onlyTurningPoints === 'boolean'
        ? plotView.onlyTurningPoints
        : fallback.onlyTurningPoints,
    compact: typeof plotView.compact === 'boolean' ? plotView.compact : fallback.compact,
  };
  return result;
}

function isPlotView(value: Partial<PlotViewSettings>): value is PlotViewSettings {
  return (
    (value.order === 'story' || value.order === 'book') &&
    typeof value.onlyTurningPoints === 'boolean' &&
    typeof value.compact === 'boolean'
  );
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
