import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import type {
  BookFontInfo,
  BookLayout,
  ExportCapabilities,
  ExportFormat,
  ExportPreview,
  ExportResult,
  ExportSettings,
  ExportTemplate,
} from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { I18n, type Texts } from '../../core/i18n/i18n';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { CoverPicker } from '../cover/cover-picker';
import { ExportPreviewPages, isPreviewFontAvailable, previewFontFamily } from './export-preview';

/** Bezeichnung und Beschreibung: `t().export.formats[…]` bzw. `t().export.templates[…]`. */
const FORMATS: readonly ExportFormat[] = ['html', 'docx', 'pdf', 'epub'];
const TEMPLATES: readonly ExportTemplate[] = ['normseite', 'roman'];
const SAVE_DELAY_MS = 500;

/** Übliche Buchformate in mm; die Vorgabe der Vorlage „Roman“ ist 125 × 190. */
const PAGE_SIZES: ReadonlyArray<{ width: number; height: number; name?: string }> = [
  { width: 120, height: 190 },
  { width: 125, height: 190 },
  { width: 135, height: 215 },
  { width: 148, height: 210, name: 'A5' },
  { width: 170, height: 220 },
  { width: 210, height: 297, name: 'A4' },
];

type MarginKey = 'marginInner' | 'marginOuter' | 'marginTop' | 'marginBottom';

/**
 * Seite „Manuskript exportieren“ (Route `export`): Format, Vorlage, Satzspiegel mit Vorschau –
 * und danach Öffnen/Zeigen. Die Auswahl merkt sich das Buch.
 */
@Component({
  selector: 'wm-export-page',
  imports: [CoverPicker, ExportPreviewPages],
  templateUrl: './export-page.html',
  styleUrl: './export-page.scss',
})
export class ExportPage {
  private readonly api = inject(WortomatApi);
  protected readonly t = inject(I18n).t;
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly project = inject(ProjectStore);
  protected readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly formats = FORMATS;
  protected readonly templates = TEMPLATES;
  protected readonly pageSizes = PAGE_SIZES;
  protected readonly margins: ReadonlyArray<{ key: MarginKey; label: () => string }> = [
    { key: 'marginInner', label: () => this.t().export.marginInner },
    { key: 'marginOuter', label: () => this.t().export.marginOuter },
    { key: 'marginTop', label: () => this.t().export.marginTop },
    { key: 'marginBottom', label: () => this.t().export.marginBottom },
  ];

  protected readonly format = signal<ExportFormat>('docx');
  protected readonly template = signal<ExportTemplate>('normseite');
  protected readonly includeSceneTitles = signal(false);
  protected readonly layout = signal<BookLayout | null>(null);
  private defaults: ExportSettings | null = null;
  /** Erst nach dem Laden speichern – sonst überschrieben die Vorgaben das Gemerkte. */
  private loaded = false;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  /** Zuletzt geladener bzw. gespeicherter Stand (JSON) – Unverändertes nicht erneut schreiben. */
  private savedJson = '';

  protected readonly preview = signal<ExportPreview | null>(null);
  /** Optionale Schriften (Computer Modern) nur, wenn installiert – oder schon gewählt. */
  protected readonly fonts = computed<BookFontInfo[]>(() =>
    (this.capabilities()?.fonts ?? []).filter(
      (font) => !font.optional || font.pdfAvailable || font.id === this.layout()?.font,
    ),
  );
  protected readonly font = computed(() =>
    this.fonts().find((font) => font.id === this.layout()?.font),
  );
  /** Schriftfamilie der Vorschau: die Datei aus TeX, sonst die Systemschrift. */
  protected readonly previewFamily = computed(() => {
    const font = this.font();
    return font ? previewFontFamily(font.id, font.cssFamily) : 'serif';
  });
  /** Kann die Vorschau die gewählte Schrift zeigen? Sonst zeigt sie eine Ersatzschrift. */
  protected readonly fontInstalled = signal(true);
  /** Vorschau und Satzspiegel gibt es nur für Formate mit fester Seite. */
  protected readonly paged = computed(() => this.hasTemplates(this.format()));
  protected readonly customizable = computed(() => this.paged() && this.template() === 'roman');
  /** Index in `pageSizes` oder `-1` für eine eigene Größe. */
  protected readonly pageSizeIndex = computed(() => {
    const layout = this.layout();
    return PAGE_SIZES.findIndex(
      (size) => size.width === layout?.pageWidth && size.height === layout?.pageHeight,
    );
  });
  protected readonly customSize = signal(false);
  protected readonly capabilities = signal<ExportCapabilities | null>(null);
  protected readonly busy = signal(false);
  protected readonly result = signal<ExportResult | null>(null);
  protected readonly downloaded = signal<{ fileName: string; warnings: string[] } | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Jede Änderung (kurz verzögert) im Buch merken
    effect(() => {
      const settings = this.currentSettings();
      if (!settings) return;
      untracked(() => {
        if (!this.loaded || JSON.stringify(settings) === this.savedJson) return;
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => void this.save(settings), SAVE_DELAY_MS);
      });
    });
    // Szenentitel ändern den Text der Vorschau
    effect(() => {
      const withTitles = this.includeSceneTitles();
      untracked(() => {
        if (this.loaded) void this.loadPreview(withTitles);
      });
    });
    // Prüfen, ob die Vorschau die gewählte Schrift laden kann (Datei aus TeX oder Systemschrift)
    effect(() => {
      const font = this.font();
      if (!font) return;
      void isPreviewFontAvailable(font.id, font.cssFamily).then((available) => {
        if (this.font()?.id === font.id) this.fontInstalled.set(available);
      });
    });
    inject(DestroyRef).onDestroy(() => this.flushSave());
    void this.load();
  }

  private readonly currentSettings = computed<ExportSettings | null>(() => {
    const layout = this.layout();
    return layout
      ? {
          format: this.format(),
          template: this.template(),
          includeSceneTitles: this.includeSceneTitles(),
          layout,
        }
      : null;
  });

  /** Dorthin zurück, woher man kam – beim direkten Aufruf zum Buch. */
  protected back(): void {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      this.location.back();
    } else {
      void this.router.navigate(['/write']);
    }
  }

  /**
   * Fähigkeiten (bei jedem Besuch neu – vielleicht wurde TeX inzwischen installiert) und die
   * gemerkten Einstellungen zusammen laden: Fehlt pdfLaTeX, wird ein gemerktes „PDF“ zu Word.
   */
  private async load(): Promise<void> {
    try {
      const [capabilities, { settings, defaults }] = await Promise.all([
        this.api.exportCapabilities(),
        this.api.exportSettings(),
      ]);
      this.capabilities.set(capabilities);
      this.defaults = defaults;
      this.format.set(
        settings.format === 'pdf' && !capabilities.pdf.available ? 'docx' : settings.format,
      );
      this.template.set(settings.template);
      this.includeSceneTitles.set(settings.includeSceneTitles);
      this.layout.set(settings.layout);
      this.customSize.set(this.pageSizeIndex() < 0);
      // Gespeichert ist, was im Buch steht – eine Umstellung PDF → Word erst bei Änderungen merken
      this.savedJson = JSON.stringify({ ...settings, format: this.format() });
      this.loaded = true;
      await this.loadPreview(settings.includeSceneTitles);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  private async loadPreview(includeSceneTitles: boolean): Promise<void> {
    try {
      this.preview.set(await this.api.exportPreview(includeSceneTitles));
    } catch {
      this.preview.set(null); // ohne Vorschau lässt sich trotzdem exportieren
    }
  }

  private async save(settings: ExportSettings): Promise<void> {
    this.saveTimer = undefined;
    this.savedJson = JSON.stringify(settings);
    try {
      await this.api.saveExportSettings(settings);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  /** Noch nicht gespeicherte Änderung sofort schreiben (beim Schließen). */
  private flushSave(): void {
    if (this.saveTimer === undefined) return;
    clearTimeout(this.saveTimer);
    const settings = this.currentSettings();
    if (settings) void this.save(settings);
  }

  protected pageSizeLabel(size: { width: number; height: number; name?: string }): string {
    const cm = (mm: number) => this.t().number(mm / 10);
    const dims = `${cm(size.width)} × ${cm(size.height)} cm`;
    const isDefault =
      size.width === this.defaults?.layout.pageWidth &&
      size.height === this.defaults?.layout.pageHeight;
    return (
      [size.name, dims].filter(Boolean).join(' · ') +
      (isDefault ? ` (${this.t().export.defaultMark})` : '')
    );
  }

  protected choosePageSize(value: string): void {
    if (value === 'custom') {
      this.customSize.set(true);
      return;
    }
    const size = PAGE_SIZES[Number(value)];
    if (!size) return;
    this.customSize.set(false);
    this.updateLayout({ pageWidth: size.width, pageHeight: size.height });
  }

  /** Zahlenfelder: Ungültiges ignorieren, das Backend legt Werte zusätzlich in ihre Grenzen. */
  protected setNumber(key: keyof BookLayout, raw: string): void {
    const value = Number(raw.replace(',', '.'));
    if (raw.trim() && Number.isFinite(value) && value > 0) this.updateLayout({ [key]: value });
  }

  protected updateLayout(change: Partial<BookLayout>): void {
    this.layout.update((layout) => (layout ? { ...layout, ...change } : layout));
  }

  protected resetLayout(): void {
    if (!this.defaults) return;
    this.layout.set(this.defaults.layout);
    this.customSize.set(false);
  }

  /** Vorlagen gibt es nur für Formate mit fester Seite. */
  protected hasTemplates(format: ExportFormat): boolean {
    return format === 'docx' || format === 'pdf';
  }

  protected isDisabled(format: ExportFormat): boolean {
    return format === 'pdf' && this.capabilities()?.pdf.available !== true;
  }

  protected choose(format: ExportFormat): void {
    if (!this.isDisabled(format)) {
      this.format.set(format);
      this.result.set(null);
      this.downloaded.set(null);
    }
  }

  protected async run(): Promise<void> {
    const request = {
      format: this.format(),
      template: this.template(),
      includeSceneTitles: this.includeSceneTitles(),
      layout: this.layout() ?? undefined,
    };
    this.flushSave();
    this.error.set(null);
    this.result.set(null);
    this.downloaded.set(null);
    // Erst speichern, was im Editor noch offen ist – sonst fehlt das Neueste im Export.
    await this.pendingSaves.flushAll();

    this.busy.set(true);
    try {
      if (this.desktop) {
        const title = this.project.project()?.title ?? this.t().export.defaultName;
        const filePath = await this.desktop.showExportDialog(title, request.format);
        if (!filePath) return;
        this.result.set(await this.api.exportToFile({ ...request, filePath }));
      } else {
        const { blob, fileName, warnings } = await this.api.exportDownload(request);
        const url = URL.createObjectURL(blob);
        const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        this.downloaded.set({ fileName, warnings });
      }
    } catch (error) {
      this.error.set(await exportErrorMessage(error, this.t()));
    } finally {
      this.busy.set(false);
    }
  }

  protected async openFile(): Promise<void> {
    const filePath = this.result()?.filePath;
    if (!filePath || !this.desktop) return;
    try {
      await this.desktop.openPath(filePath);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  protected async showInFolder(): Promise<void> {
    const filePath = this.result()?.filePath;
    if (filePath && this.desktop) await this.desktop.showItemInFolder(filePath);
  }
}

/** Beim Download kommt auch eine Fehlermeldung als Blob – dann den Text daraus lesen. */
async function exportErrorMessage(error: unknown, t: Texts): Promise<string> {
  if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
    try {
      const body = JSON.parse(await error.error.text()) as { message?: unknown };
      if (typeof body.message === 'string') return body.message;
    } catch {
      // kein JSON – unten die allgemeine Meldung
    }
  }
  return errorMessage(error, t);
}
