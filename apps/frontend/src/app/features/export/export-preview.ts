import {
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
  afterNextRender,
} from '@angular/core';
import type { BookLayout, ExportPreview, ExportTemplate } from '@wortomat/shared';
import { I18n } from '../../core/i18n/i18n';

const PT_PER_MM = 72 / 25.4;
const PX_PER_MM = 96 / 25.4;
/** Gezeigte Textseiten nach der Titelseite. */
const TEXT_PAGES = 3;
const PAGE_GAP_PX = 12;
/** Abstand zwischen den Spalten, in die der Text umbrochen wird (unsichtbar, s. u.). */
const COLUMN_GAP_MM = 10;

/** Seitenmaße und Schrift, wie sie die Vorlage im PDF bzw. in Word verwendet. */
interface Geometry {
  style: ExportTemplate;
  width: number;
  height: number;
  /** Rand am Bund bzw. links (Normseite: einseitig). */
  inner: number;
  outer: number;
  top: number;
  bottom: number;
  mirror: boolean;
  fontFamily: string;
  /** pt */
  fontSize: number;
  /** pt */
  lineHeight: number;
  /** Abstand Textende → Seitenzahl (mm), nur Roman */
  footskip: number;
}

/**
 * Normseite wie im Export: A4, Courier 12 pt auf 18 pt, 60 Anschläge (432 pt) breit,
 * 30 Zeilen hoch, Satzspiegel 2,5 cm vom linken und 3 cm vom oberen Rand.
 */
const NORMSEITE: Omit<Geometry, 'fontFamily'> = {
  style: 'normseite',
  width: 210,
  height: 297,
  inner: 25,
  outer: 210 - 25 - 432 / PT_PER_MM,
  top: 30,
  bottom: 297 - 30 - (30 * 18) / PT_PER_MM,
  mirror: false,
  fontSize: 12,
  lineHeight: 18,
  footskip: 0,
};
const COURIER = "'TeX Gyre Cursor', 'Courier New', Courier, 'Nimbus Mono PS', monospace";

const FONT_STYLES = [
  { style: 'regular', descriptors: { style: 'normal', weight: '400' } },
  { style: 'italic', descriptors: { style: 'italic', weight: '400' } },
  { style: 'bold', descriptors: { style: 'normal', weight: '700' } },
  { style: 'boldItalic', descriptors: { style: 'italic', weight: '700' } },
] as const;
const registered = new Set<string>();

/**
 * Schriftfamilie für die Vorschau: zuerst die Schriftdateien aus der TeX-Installation (dieselben,
 * die das PDF verwendet – unabhängig davon, welche Schriften der Browser kennt oder freigibt),
 * dahinter die Systemschriften. Der Browser lädt eine Datei erst, wenn sie gebraucht wird.
 */
export function previewFontFamily(id: string, systemFamily: string): string {
  const family = `Wortomat Vorschau ${id}`;
  if (!registered.has(id)) {
    registered.add(id);
    for (const { style, descriptors } of FONT_STYLES) {
      const face = new FontFace(family, `url(/api/export/fonts/${id}/${style})`, descriptors);
      document.fonts.add(face);
    }
  }
  return `'${family}', ${systemFamily}`;
}

/** Steht die Schrift der Vorschau zur Verfügung – als Datei aus TeX oder als Systemschrift? */
export async function isPreviewFontAvailable(id: string, systemFamily: string): Promise<boolean> {
  const family = previewFontFamily(id, systemFamily);
  try {
    const faces = await document.fonts.load(`16px 'Wortomat Vorschau ${id}'`);
    if (faces.some((face) => face.status === 'loaded')) return true;
  } catch {
    // Datei nicht ladbar – dann zählt nur die Systemschrift
  }
  return isFontInstalled(family.slice(family.indexOf(',') + 1));
}

/**
 * Seitenvorschau im Export-Dialog: Titelseite und die ersten Textseiten des ersten Kapitels in
 * echten Maßen (mm/pt), verkleinert auf die verfügbare Breite.
 *
 * Seitenumbruch: Der Text fließt in CSS-Spalten von der Höhe des Satzspiegels; jede Seite zeigt
 * genau eine dieser Spalten (die übrigen sind weggeschoben und abgeschnitten). So bricht der
 * Browser zwischen Zeilen um – nie mitten durch eine Zeile, auch nicht nach Zitaten oder Bildern.
 */
@Component({
  selector: 'wm-export-preview',
  // Das Kapitel-HTML kommt per innerHTML – die Regeln dafür müssen global greifen.
  encapsulation: ViewEncapsulation.None,
  template: `
    <div #frame class="wm-export-preview" [attr.data-style]="geometry().style">
      <div class="pages" [style.gap.px]="gap">
        <!-- Titelseite (rechte Seite, ohne Seitenzahl) -->
        <div class="page" [style]="pageStyle()" [style.zoom]="scale()">
          <div class="text" [style]="textStyle(1)">
            @if (geometry().style === 'normseite') {
              <div class="ns-title-head">{{ content()?.author || ' ' }}</div>
              <div class="ns-title" [style.margin-top.pt]="8 * geometry().lineHeight">
                <strong>{{ content()?.title }}</strong>
                @if (content()?.author; as author) {
                  <!-- wie im Export: immer „von“ -->
                  <div [style.margin-top.pt]="geometry().lineHeight">von {{ author }}</div>
                }
              </div>
            } @else {
              <div class="title">
                <div class="title-spacer" [style.height.pt]="textHeightPt() * 0.25"></div>
                <div class="book-title">{{ content()?.title }}</div>
                @if (content()?.author; as author) {
                  <div class="book-author">{{ author }}</div>
                }
              </div>
            }
          </div>
        </div>

        @for (page of textPages; track page) {
          <div class="page" [style]="pageStyle()" [style.zoom]="scale()">
            @if (geometry().style === 'normseite') {
              <div class="ns-header" [style]="headerStyle(page)">
                <span>{{ runningHead() }}</span
                ><span>{{ page }}</span>
              </div>
            }
            <div class="text" [style]="textStyle(page)">
              <div class="flow" lang="de" [style]="flowStyle(page)">
                @if (content()?.chapterTitle; as chapter) {
                  <div class="chapter-head" [style.height.pt]="chapterHeadPt()">
                    <div
                      class="chapter-title"
                      [style.padding-top.pt]="
                        geometry().style === 'roman' ? textHeightPt() * 0.15 : 0
                      "
                    >
                      {{ chapter }}
                    </div>
                  </div>
                  <div class="content" [innerHTML]="content()?.html ?? ''"></div>
                } @else if (page === 1) {
                  <p class="empty">{{ t().export.previewEmpty }}</p>
                }
              </div>
            </div>
            @if (geometry().style === 'roman') {
              <div class="page-number" [style]="pageNumberStyle()">{{ page }}</div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './export-preview.scss',
})
export class ExportPreviewPages {
  protected readonly t = inject(I18n).t;

  readonly template = input.required<ExportTemplate>();
  readonly layout = input.required<BookLayout>();
  /** CSS-Schriftfamilie der gewählten Schrift (nur „Roman“). */
  readonly fontFamily = input.required<string>();
  readonly content = input<ExportPreview | null>(null);

  protected readonly textPages = Array.from({ length: TEXT_PAGES }, (_, i) => i + 1);
  protected readonly gap = PAGE_GAP_PX;

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly availableWidth = signal(0);

  protected readonly geometry = computed<Geometry>(() => {
    if (this.template() === 'normseite') {
      return { ...NORMSEITE, fontFamily: previewFontFamily('courier', COURIER) };
    }
    const layout = this.layout();
    return {
      style: 'roman',
      width: layout.pageWidth,
      height: layout.pageHeight,
      inner: layout.marginInner,
      outer: layout.marginOuter,
      top: layout.marginTop,
      bottom: layout.marginBottom,
      mirror: true,
      fontFamily: this.fontFamily(),
      fontSize: layout.fontSize,
      // wie im PDF: Klasse „book“ (11 pt auf 13,6 pt) mit \linespread{1.08}
      lineHeight: layout.fontSize * (13.6 / 11) * 1.08,
      footskip: Math.min(10, Math.max(4, layout.marginBottom * 0.45)),
    };
  });

  protected readonly textHeightPt = computed(() => {
    const g = this.geometry();
    return (g.height - g.top - g.bottom) * PT_PER_MM;
  });

  /** Kapitelanfang: Roman 15 % tiefer, großer Titel, zwei Leerzeilen; Normseite: Titel + Leerzeile. */
  protected readonly chapterHeadPt = computed(() => {
    const g = this.geometry();
    if (g.style === 'normseite') return 2 * g.lineHeight;
    return this.textHeightPt() * 0.15 + g.fontSize * 1.31 * 1.25 + 2 * g.lineHeight;
  });

  protected readonly runningHead = computed(() =>
    [this.content()?.author, this.content()?.title].filter(Boolean).join(': '),
  );

  /** Zwei Seiten nebeneinander, höchstens Originalgröße. */
  protected readonly scale = computed(() => {
    const width = this.availableWidth();
    if (!width) return 0.5;
    const pageWidth = this.geometry().width * PX_PER_MM;
    return Math.min(1, (width - PAGE_GAP_PX) / 2 / pageWidth);
  });

  constructor() {
    const observer = new ResizeObserver(([entry]) =>
      this.availableWidth.set(entry?.contentRect.width ?? 0),
    );
    afterNextRender(() => observer.observe(this.frame().nativeElement));
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }

  protected pageStyle(): Record<string, string> {
    const g = this.geometry();
    return {
      width: `${g.width}mm`,
      height: `${g.height}mm`,
      'font-family': g.fontFamily,
      'font-size': `${g.fontSize}pt`,
      'line-height': `${g.lineHeight}pt`,
    };
  }

  /** Rechte (ungerade) Seiten haben den Bund links, linke Seiten rechts. */
  private left(page: number): number {
    const g = this.geometry();
    return !g.mirror || page % 2 === 1 ? g.inner : g.outer;
  }

  protected textStyle(page: number): Record<string, string> {
    const g = this.geometry();
    return {
      left: `${this.left(page)}mm`,
      top: `${g.top}mm`,
      width: `${g.width - g.inner - g.outer}mm`,
      height: `${this.textHeightPt()}pt`,
    };
  }

  /** Spalten so breit und hoch wie der Satzspiegel; Seite n zeigt die n-te Spalte. */
  protected flowStyle(page: number): Record<string, string> {
    const g = this.geometry();
    const width = g.width - g.inner - g.outer;
    return {
      width: `${width}mm`,
      height: `${this.textHeightPt()}pt`,
      'column-width': `${width}mm`,
      'column-gap': `${COLUMN_GAP_MM}mm`,
      'column-fill': 'auto',
      transform: `translateX(-${(page - 1) * (width + COLUMN_GAP_MM)}mm)`,
    };
  }

  /** Normseite: „Autor: Titel“ links, Seitenzahl rechts, 24 pt über dem Text. */
  protected headerStyle(page: number): Record<string, string> {
    const g = this.geometry();
    return {
      left: `${this.left(page)}mm`,
      top: `calc(${g.top}mm - 24pt - ${g.lineHeight}pt)`,
      width: `${g.width - g.inner - g.outer}mm`,
    };
  }

  protected pageNumberStyle(): Record<string, string> {
    const g = this.geometry();
    return {
      top: `calc(${g.top}mm + ${this.textHeightPt()}pt + ${g.footskip}mm - ${g.fontSize}pt)`,
      'font-size': `${g.fontSize * 0.9}pt`,
    };
  }
}

/**
 * Ist eine der genannten Schriften installiert? Misst einen Probetext mit der Schrift und
 * jeweils zwei Ersatzschriften – fehlt die Schrift, sind die Breiten gleich.
 */
export function isFontInstalled(cssFamily: string): boolean {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return true;
  const sample = 'Wortomat schreibt Bücher – Qualität 0123456789';
  const width = (font: string) => {
    context.font = `32px ${font}`;
    return context.measureText(sample).width;
  };
  const families = cssFamily
    .split(',')
    .map((family) => family.trim())
    .filter((family) => !/^(serif|sans-serif|monospace)$/.test(family));
  return families.some((family) =>
    ['monospace', 'sans-serif'].some(
      (fallback) => width(`${family}, ${fallback}`) !== width(fallback),
    ),
  );
}
