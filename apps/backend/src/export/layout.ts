import type {
  BookFont,
  BookLayout,
  ExportFormat,
  ExportSettings,
  ExportTemplate,
} from '@wortomat/shared';

/** The former layout of the "novel" template: 12.5 × 19 cm, Palatino 11 pt. */
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
  includeParts: true,
  sceneBreak: null,
  layout: DEFAULT_LAYOUT,
};

export interface FontSpec {
  label: string;
  /** TeX packages in order of preference; all work with pdfLaTeX. */
  latex: readonly string[];
  /** Font name in the Word file (the reader must have the font installed). */
  docx: string;
  /** TeX and system names of the font, for the browser preview. */
  css: string;
  /** Only offered when one of the TeX packages is installed. */
  optional?: boolean;
  /** OpenType files from the TeX installation – the preview loads exactly this font. */
  files: FontFiles;
}

export type FontStyle = 'regular' | 'italic' | 'bold' | 'boldItalic';
export type FontFiles = Record<FontStyle, string>;

const texGyre = (name: string): FontFiles => ({
  regular: `texgyre${name}-regular.otf`,
  italic: `texgyre${name}-italic.otf`,
  bold: `texgyre${name}-bold.otf`,
  boldItalic: `texgyre${name}-bolditalic.otf`,
});

export const COURIER_FILES: FontFiles = texGyre('cursor');

/** Good book fonts that exist both as a TeX package and as a common system font. */
export const BOOK_FONTS: Record<BookFont, FontSpec> = {
  palatino: {
    label: 'Palatino',
    latex: ['tgpagella', 'mathpazo'],
    docx: 'Palatino Linotype',
    css: "'TeX Gyre Pagella', 'Palatino Linotype', Palatino, 'Book Antiqua', serif",

    files: texGyre('pagella'),
  },
  garamond: {
    label: 'Garamond',
    latex: ['ebgaramond'],
    docx: 'Garamond',
    css: "'EB Garamond', 'EB Garamond 12', Garamond, serif",

    files: {
      regular: 'EBGaramond-Regular.otf',
      italic: 'EBGaramond-Italic.otf',
      bold: 'EBGaramond-Bold.otf',
      boldItalic: 'EBGaramond-BoldItalic.otf',
    },
  },
  libertinus: {
    label: 'Libertinus',
    latex: ['libertinus', 'libertine'],
    docx: 'Libertinus Serif',
    css: "'Libertinus Serif', 'Linux Libertine O', 'Linux Libertine', serif",

    files: {
      regular: 'LibertinusSerif-Regular.otf',
      italic: 'LibertinusSerif-Italic.otf',
      bold: 'LibertinusSerif-Bold.otf',
      boldItalic: 'LibertinusSerif-BoldItalic.otf',
    },
  },
  charter: {
    label: 'Charter',
    latex: ['XCharter', 'charter'],
    docx: 'Charter',
    css: "XCharter, Charter, 'Bitstream Charter', serif",

    files: {
      regular: 'XCharter-Roman.otf',
      italic: 'XCharter-Italic.otf',
      bold: 'XCharter-Bold.otf',
      boldItalic: 'XCharter-BoldItalic.otf',
    },
  },
  times: {
    label: 'Times',
    latex: ['tgtermes', 'mathptmx'],
    docx: 'Times New Roman',
    css: "'TeX Gyre Termes', 'Times New Roman', Times, serif",

    files: texGyre('termes'),
  },
  schoolbook: {
    label: 'Century Schoolbook',
    latex: ['tgschola'],
    docx: 'Century Schoolbook',
    css: "'TeX Gyre Schola', 'Century Schoolbook', 'New Century Schoolbook', serif",

    files: texGyre('schola'),
  },
  bookman: {
    label: 'Bookman',
    latex: ['tgbonum'],
    docx: 'Bookman Old Style',
    css: "'TeX Gyre Bonum', 'Bookman Old Style', Bookman, serif",

    files: texGyre('bonum'),
  },
  sourceserif: {
    label: 'Source Serif',
    latex: ['sourceserifpro'],
    docx: 'Source Serif Pro',
    css: "'Source Serif Pro', 'Source Serif 4', serif",

    files: {
      regular: 'SourceSerifPro-Regular.otf',
      italic: 'SourceSerifPro-RegularIt.otf',
      bold: 'SourceSerifPro-Bold.otf',
      boldItalic: 'SourceSerifPro-BoldIt.otf',
    },
  },
  crimson: {
    label: 'Crimson',
    latex: ['crimson'],
    docx: 'Crimson Text',
    css: "'Crimson Text', Crimson, serif",

    files: {
      regular: 'Crimson-Roman.otf',
      italic: 'Crimson-Italic.otf',
      bold: 'Crimson-Bold.otf',
      boldItalic: 'Crimson-BoldItalic.otf',
    },
  },
  latinmodern: {
    label: 'Latin Modern',
    latex: ['lmodern'],
    docx: 'Latin Modern Roman',
    css: "'Latin Modern Roman', 'LM Roman 10', 'CMU Serif', serif",

    files: {
      regular: 'lmroman10-regular.otf',
      italic: 'lmroman10-italic.otf',
      bold: 'lmroman10-bold.otf',
      boldItalic: 'lmroman10-bolditalic.otf',
    },
  },
  // The LaTeX default font. With T1 (umlauts, hyphenation) it needs cm-super as a Type 1 font –
  // without it pdfLaTeX would use blurry bitmaps, so Latin Modern then.
  computermodern: {
    label: 'Computer Modern',
    latex: ['type1ec'],
    docx: 'CMU Serif',
    css: "'CMU Serif', 'Latin Modern Roman', 'LM Roman 10', serif",
    optional: true,

    files: {
      regular: 'cmunrm.otf',
      italic: 'cmunti.otf',
      bold: 'cmunbx.otf',
      boldItalic: 'cmunbi.otf',
    },
  },
};

/** Generous, but always leaving a usable type area. */
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

/** Unknown or invalid values fall back to the defaults, numbers are clamped to their limits. */
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
    // half points are enough
    fontSize: round(number(value.fontSize, d.fontSize, LIMITS.fontSize) * 2, 0) / 2,
  };
  // If no sensible type area is left, shrink the margins proportionally.
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
    // Older settings do not know the switch – parts were always printed there
    includeParts: value.includeParts !== false,
    sceneBreak: sanitizeSceneBreak(value.sceneBreak),
    layout: sanitizeLayout(value.layout),
  };
}

const MAX_SCENE_BREAK_LENGTH = 50;

/**
 * One line only: the break is a single centred paragraph in every format. Inner spaces stay – they
 * are the usual way to spread out `*   *   *`.
 */
export function sanitizeSceneBreak(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return value
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, MAX_SCENE_BREAK_LENGTH);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
