import { HttpErrorResponse } from '@angular/common/http';
import { Component, type ElementRef, inject, signal, viewChild } from '@angular/core';
import type {
  ExportCapabilities,
  ExportFormat,
  ExportResult,
  ExportTemplate,
} from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';

interface Choice<T> {
  value: T;
  label: string;
  description: string;
}

const FORMATS: ReadonlyArray<Choice<ExportFormat>> = [
  { value: 'html', label: 'HTML', description: 'Eine Datei zum Lesen im Browser – mit Bildern.' },
  {
    value: 'docx',
    label: 'Word (.docx)',
    description: 'Zum Weiterbearbeiten oder Einreichen bei Verlag und Agentur.',
  },
  { value: 'pdf', label: 'PDF (pdfLaTeX)', description: 'Druckfertig gesetzt mit pdfLaTeX.' },
  {
    value: 'epub',
    label: 'E-Book (EPUB)',
    description: 'Für E-Reader wie Tolino oder Kobo, Apple Books und Calibre.',
  },
];

const TEMPLATES: ReadonlyArray<Choice<ExportTemplate>> = [
  {
    value: 'normseite',
    label: 'Normseite',
    description: '30 Zeilen à 60 Zeichen in Courier – der Standard für Verlage und Agenturen.',
  },
  {
    value: 'roman',
    label: 'Roman',
    description: 'Buchsatz 12,5 × 19 cm, Blocksatz mit Silbentrennung.',
  },
];

/** Dialog „Manuskript exportieren“: Format, Vorlage, Optionen – und danach Öffnen/Zeigen. */
@Component({
  selector: 'wm-export-dialog',
  templateUrl: './export-dialog.html',
  styleUrl: './export-dialog.scss',
})
export class ExportDialog {
  private readonly api = inject(WortomatApi);
  private readonly pendingSaves = inject(PendingSaves);
  private readonly project = inject(ProjectStore);
  protected readonly desktop = inject(DESKTOP_BRIDGE);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly formats = FORMATS;
  protected readonly templates = TEMPLATES;

  protected readonly format = signal<ExportFormat>('docx');
  protected readonly template = signal<ExportTemplate>('normseite');
  protected readonly includeSceneTitles = signal(false);
  protected readonly capabilities = signal<ExportCapabilities | null>(null);
  protected readonly busy = signal(false);
  protected readonly result = signal<ExportResult | null>(null);
  protected readonly downloaded = signal<{ fileName: string; warnings: string[] } | null>(null);
  protected readonly error = signal<string | null>(null);

  open(): void {
    this.result.set(null);
    this.downloaded.set(null);
    this.error.set(null);
    this.dialog().nativeElement.showModal();
    // Jedes Mal neu prüfen – vielleicht wurde TeX inzwischen installiert.
    this.api
      .exportCapabilities()
      .then((caps) => {
        this.capabilities.set(caps);
        if (!caps.pdf.available && this.format() === 'pdf') this.format.set('docx');
      })
      .catch((error: unknown) => this.error.set(errorMessage(error)));
  }

  protected close(): void {
    this.dialog().nativeElement.close();
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
    };
    this.error.set(null);
    this.result.set(null);
    this.downloaded.set(null);
    // Erst speichern, was im Editor noch offen ist – sonst fehlt das Neueste im Export.
    await this.pendingSaves.flushAll();

    this.busy.set(true);
    try {
      if (this.desktop) {
        const title = this.project.project()?.title ?? 'Manuskript';
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
      this.error.set(await exportErrorMessage(error));
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
      this.error.set(errorMessage(error));
    }
  }

  protected async showInFolder(): Promise<void> {
    const filePath = this.result()?.filePath;
    if (filePath && this.desktop) await this.desktop.showItemInFolder(filePath);
  }
}

/** Beim Download kommt auch eine Fehlermeldung als Blob – dann den Text daraus lesen. */
async function exportErrorMessage(error: unknown): Promise<string> {
  if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
    try {
      const body = JSON.parse(await error.error.text()) as { message?: unknown };
      if (typeof body.message === 'string') return body.message;
    } catch {
      // kein JSON – unten die allgemeine Meldung
    }
  }
  return errorMessage(error);
}
