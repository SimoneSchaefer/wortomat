import type {
  BookFont,
  BookLayout,
  ExportFormat,
  ExportSettings,
  ExportTemplate,
} from '@wortomat/shared';

/** Bisheriges Layout der Vorlage „Roman“: 12,5 × 19 cm, Palatino 11 pt. */
export const DEFAULT_LAYOUT: BookLayout = {
  pageWidth: 125,
  pageHeight: 190,
  marginInner: 20,
  marginOuter: 15,
  marginTop: 18,
  marginBottom: 22,
  font: 'palatino',
  fontSize: 11,
};

export const DEFAULT_SETTINGS: ExportSettings = {
  format: 'docx',
  template: 'normseite',
  includeSceneTitles: false,
  layout: DEFAULT_LAYOUT,
};

export interface FontSpec {
  label: string;
  /** TeX-Pakete in Reihenfolge der Vorliebe; alle funktionieren mit pdfLaTeX. */
  latex: readonly string[];
  /** Schriftname in der Word-Datei (dort muss die Schrift beim Leser installiert sein). */
  docx: string;
  /** Für die Vorschau im Browser: TeX- und Systemnamen der Schrift. */
  css: string;
  /** Nur anbieten, wenn eins der TeX-Pakete installiert ist. */
  optional?: boolean;
}

/** Gute Buchschriften, die es als TeX-Paket und als verbreitete Systemschrift gibt. */
export const BOOK_FONTS: Record<BookFont, FontSpec> = {
  palatino: {
    label: 'Palatino',
    latex: ['tgpagella', 'mathpazo'],
    docx: 'Palatino Linotype',
    css: "'TeX Gyre Pagella', 'Palatino Linotype', Palatino, 'Book Antiqua', serif",
  },
  garamond: {
    label: 'Garamond',
    latex: ['ebgaramond'],
    docx: 'Garamond',
    css: "'EB Garamond', 'EB Garamond 12', Garamond, serif",
  },
  libertinus: {
    label: 'Libertinus',
    latex: ['libertinus', 'libertine'],
    docx: 'Libertinus Serif',
    css: "'Libertinus Serif', 'Linux Libertine O', 'Linux Libertine', serif",
  },
  charter: {
    label: 'Charter',
    latex: ['XCharter', 'charter'],
    docx: 'Charter',
    css: "XCharter, Charter, 'Bitstream Charter', serif",
  },
  times: {
    label: 'Times',
    latex: ['tgtermes', 'mathptmx'],
    docx: 'Times New Roman',
    css: "'TeX Gyre Termes', 'Times New Roman', Times, serif",
  },
  schoolbook: {
    label: 'Century Schoolbook',
    latex: ['tgschola'],
    docx: 'Century Schoolbook',
    css: "'TeX Gyre Schola', 'Century Schoolbook', 'New Century Schoolbook', serif",
  },
  bookman: {
    label: 'Bookman',
    latex: ['tgbonum'],
    docx: 'Bookman Old Style',
    css: "'TeX Gyre Bonum', 'Bookman Old Style', Bookman, serif",
  },
  sourceserif: {
    label: 'Source Serif',
    latex: ['sourceserifpro'],
    docx: 'Source Serif Pro',
    css: "'Source Serif Pro', 'Source Serif 4', serif",
  },
  crimson: {
    label: 'Crimson',
    latex: ['crimson'],
    docx: 'Crimson Text',
    css: "'Crimson Text', Crimson, serif",
  },
  latinmodern: {
    label: 'Latin Modern',
    latex: ['lmodern'],
    docx: 'Latin Modern Roman',
    css: "'Latin Modern Roman', 'LM Roman 10', 'CMU Serif', serif",
  },
  // Die LaTeX-Standardschrift. Mit T1 (Umlaute, Silbentrennung) braucht sie cm-super als
  // Type-1-Schrift – ohne das würde pdfLaTeX unscharfe Bitmaps einsetzen, daher dann Latin Modern.
  computermodern: {
    label: 'Computer Modern',
    latex: ['type1ec'],
    docx: 'CMU Serif',
    css: "'CMU Serif', 'Latin Modern Roman', 'LM Roman 10', serif",
    optional: true,
  },
};

/** Grenzen für die Eingaben – großzügig, aber so, dass immer ein brauchbarer Satzspiegel bleibt. */
const LIMITS = {
  pageWidth: [80, 300],
  pageHeight: [100, 400],
  margin: [5, 60],
  fontSize: [8, 18],
} as const;
const MIN_TEXT_WIDTH = 40;
const MIN_TEXT_HEIGHT = 50;

const FORMATS: readonly ExportFormat[] = ['html', 'docx', 'pdf', 'epub'];
const TEMPLATES: readonly ExportTemplate[] = ['normseite', 'roman'];

/** Unbekanntes oder Ungültiges wird durch die Vorgabe ersetzt, Zahlen in ihre Grenzen gelegt. */
export function sanitizeLayout(input: unknown): BookLayout {
  const value = (input ?? {}) as Partial<Record<keyof BookLayout, unknown>>;
  const number = (raw: unknown, fallback: number, [min, max]: readonly [number, number]) => {
    const parsed = typeof raw === 'number' ? raw : Number.NaN;
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, round(parsed, 1))) : fallback;
  };
  const d = DEFAULT_LAYOUT;
  const layout: BookLayout = {
    pageWidth: number(value.pageWidth, d.pageWidth, LIMITS.pageWidth),
    pageHeight: number(value.pageHeight, d.pageHeight, LIMITS.pageHeight),
    marginInner: number(value.marginInner, d.marginInner, LIMITS.margin),
    marginOuter: number(value.marginOuter, d.marginOuter, LIMITS.margin),
    marginTop: number(value.marginTop, d.marginTop, LIMITS.margin),
    marginBottom: number(value.marginBottom, d.marginBottom, LIMITS.margin),
    font:
      typeof value.font === 'string' && value.font in BOOK_FONTS
        ? (value.font as BookFont)
        : d.font,
    // halbe Punkte genügen
    fontSize: round(number(value.fontSize, d.fontSize, LIMITS.fontSize) * 2, 0) / 2,
  };
  // Bleibt kein sinnvoller Satzspiegel übrig, die Ränder anteilig verkleinern.
  const shrink = (size: number, a: number, b: number, min: number): [number, number] => {
    if (size - a - b >= min) return [a, b];
    const factor = Math.max(0, size - min) / (a + b);
    return [round(a * factor, 1), round(b * factor, 1)];
  };
  [layout.marginInner, layout.marginOuter] = shrink(
    layout.pageWidth,
    layout.marginInner,
    layout.marginOuter,
    MIN_TEXT_WIDTH,
  );
  [layout.marginTop, layout.marginBottom] = shrink(
    layout.pageHeight,
    layout.marginTop,
    layout.marginBottom,
    MIN_TEXT_HEIGHT,
  );
  return layout;
}

export function sanitizeSettings(input: unknown): ExportSettings {
  const value = (input ?? {}) as Partial<Record<keyof ExportSettings, unknown>>;
  return {
    format: FORMATS.includes(value.format as ExportFormat)
      ? (value.format as ExportFormat)
      : DEFAULT_SETTINGS.format,
    template: TEMPLATES.includes(value.template as ExportTemplate)
      ? (value.template as ExportTemplate)
      : DEFAULT_SETTINGS.template,
    includeSceneTitles: value.includeSceneTitles === true,
    layout: sanitizeLayout(value.layout),
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
