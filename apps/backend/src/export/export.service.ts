import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  BookFont,
  ExportCapabilities,
  ExportFormat,
  ExportPreview,
  ExportRequest,
  ExportSettings,
  ExportSettingsResponse,
  ExportTemplate,
  ProjectInfo,
} from '@wortomat/shared';
import { ImagesService } from '../images/images.service.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { ProjectService } from '../project/project.service.js';
import {
  type Book,
  buildBook,
  type ImageResolver,
  imageSize,
  type JsonNode,
  plainText,
  safeFileName,
  withoutParts,
} from './book.js';
import { renderDocx } from './docx-renderer.js';
import { renderEpub } from './epub-renderer.js';
import { contentHtml, escapeHtml, renderHtml } from './html-renderer.js';
import {
  BOOK_FONTS,
  COURIER_FILES,
  DEFAULT_SETTINGS,
  type FontFiles,
  type FontStyle,
  sanitizeLayout,
  sanitizeSettings,
} from './layout.js';
import { renderLatex } from './latex-renderer.js';
import {
  compilePdf,
  findLatexPackages,
  findPdflatex,
  findTexFile,
  type PdflatexInstallation,
} from './pdflatex.js';
import { type Localized, LocalizedError, localized } from '../i18n.js';

const FORMATS: Record<ExportFormat, { extension: string; mimeType: string }> = {
  html: { extension: 'html', mimeType: 'text/html; charset=utf-8' },
  docx: {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  pdf: { extension: 'pdf', mimeType: 'application/pdf' },
  epub: { extension: 'epub', mimeType: 'application/epub+zip' },
};
const TEMPLATES: readonly ExportTemplate[] = ['normseite', 'roman'];
/** Etwa so viel Text, wie auf die Vorschauseiten passt (eher mehr). */
const PREVIEW_CHARACTERS = 8000;

export interface ExportedFile {
  fileName: string;
  extension: string;
  mimeType: string;
  data: Buffer;
  warnings: Localized[];
}

@Injectable()
export class ExportService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
    private readonly images: ImagesService,
  ) {}

  async capabilities(): Promise<ExportCapabilities> {
    const pdflatex = await findPdflatex();
    const available = pdflatex ? await availableFonts(pdflatex) : new Set<BookFont>();
    return {
      pdf: { available: pdflatex !== null, version: pdflatex?.version ?? null },
      fonts: (Object.keys(BOOK_FONTS) as BookFont[]).map((id) => ({
        id,
        label: BOOK_FONTS[id].label,
        cssFamily: BOOK_FONTS[id].css,
        pdfAvailable: available.has(id),
        optional: BOOK_FONTS[id].optional === true,
      })),
    };
  }

  /**
   * Pfad einer Schriftdatei für die Vorschau – nur Dateien aus dem Schriftkatalog, gesucht in
   * der TeX-Installation. `null`, wenn es sie (oder TeX) nicht gibt.
   */
  async fontFile(font: string, style: string): Promise<string | null> {
    const files: FontFiles | undefined =
      font === 'courier' ? COURIER_FILES : BOOK_FONTS[font as BookFont]?.files;
    const name = files && Object.hasOwn(files, style) ? files[style as FontStyle] : undefined;
    if (!name) return null;
    if (!this.fontPaths.has(name)) {
      const pdflatex = await findPdflatex();
      this.fontPaths.set(name, pdflatex ? await findTexFile(pdflatex, name) : null);
    }
    return this.fontPaths.get(name) ?? null;
  }

  /** Gefundene Schriftdateien (Name → Pfad); auch Fehlanzeigen, damit nicht ständig gesucht wird. */
  private readonly fontPaths = new Map<string, string | null>();

  /** Gespeicherte Einstellungen des Export-Dialogs; fehlt etwas, gelten die Vorgaben. */
  settings(): ExportSettingsResponse {
    this.requireProject();
    const row = this.projects.db
      .prepare('SELECT export_settings FROM project WHERE id = 1')
      .get() as { export_settings: string | null } | undefined;
    let stored: unknown = null;
    try {
      stored = row?.export_settings ? JSON.parse(row.export_settings) : null;
    } catch {
      // kaputtes JSON → Vorgaben
    }
    return { settings: sanitizeSettings(stored), defaults: DEFAULT_SETTINGS };
  }

  saveSettings(input: unknown): ExportSettings {
    this.requireProject();
    const settings = sanitizeSettings(input);
    this.projects.db
      .prepare('UPDATE project SET export_settings = ? WHERE id = 1')
      .run(JSON.stringify(settings));
    return settings;
  }

  /** Anfang des Buchs für die Seitenvorschau: Titel und das erste Kapitel mit Text. */
  preview(includeSceneTitles: boolean): ExportPreview {
    const project = this.requireProject();
    const book = this.book(project);
    const chapter = book.items.find((item) => item.kind === 'chapter' && item.scenes.length > 0);
    const image = (src: string) => src; // Bilder lädt der Browser selbst über /api/images/…
    // Die Vorschau zeigt nur wenige Seiten – mehr als den Kapitelanfang braucht sie nicht.
    let budget = PREVIEW_CHARACTERS;
    const parts: string[] = [];
    if (chapter?.kind === 'chapter') {
      for (const [index, scene] of chapter.scenes.entries()) {
        if (budget <= 0) break;
        parts.push(
          includeSceneTitles
            ? `<h3 class="scene-title">${escapeHtml(scene.title)}</h3>`
            : index > 0
              ? '<p class="scene-break" aria-hidden="true">*&#x2003;*&#x2003;*</p>'
              : '',
        );
        const blocks: JsonNode[] = [];
        for (const block of scene.doc.content ?? []) {
          if (budget <= 0) break;
          blocks.push(block);
          budget -= plainText(block).length;
        }
        parts.push(contentHtml(blocks, image));
      }
    }
    const html = parts.join('');
    return {
      title: book.title,
      author: book.author,
      chapterTitle: chapter?.title ?? null,
      html,
    };
  }

  async export(request: ExportRequest): Promise<ExportedFile> {
    const format = request?.format;
    if (!format || !(format in FORMATS)) {
      throw new BadRequestException(
        localized('Unbekanntes Exportformat.', 'Unknown export format.'),
      );
    }
    const template = TEMPLATES.includes(request.template) ? request.template : 'normseite';
    const options = { includeSceneTitles: request.includeSceneTitles === true };
    const layout = sanitizeLayout(request.layout);
    const project = this.requireProject();
    const fullBook = this.book(project);
    const book = request.includeParts === false ? withoutParts(fullBook) : fullBook;
    const images = this.imageResolver();

    let data: Buffer;
    let warnings: Localized[] = [];
    switch (format) {
      case 'html':
        data = renderHtml(book, options, images);
        break;
      case 'docx':
        ({ data, warnings } = await renderDocx(book, template, options, images, layout));
        break;
      case 'epub':
        ({ data, warnings } = await renderEpub(book, options, images, {
          identifier: bookIdentifier(project.createdAt),
          modified: new Date(),
          cover: project.coverImageId ? images(`/api/images/${project.coverImageId}`) : null,
        }));
        break;
      case 'pdf': {
        const pdflatex = await findPdflatex();
        if (!pdflatex) {
          throw new ConflictException(
            localized(
              'pdfLaTeX wurde auf diesem Rechner nicht gefunden.',
              'pdfLaTeX was not found on this computer.',
            ),
          );
        }
        const document = renderLatex(book, template, options, images, layout);
        warnings = document.warnings;
        if (template === 'roman' && !(await availableFonts(pdflatex)).has(layout.font)) {
          const label = BOOK_FONTS[layout.font].label;
          warnings.push(
            localized(
              `Die Schrift „${label}“ ist in deiner TeX-Installation nicht vorhanden; das PDF verwendet stattdessen Latin Modern.`,
              `The font “${label}” is not installed in your TeX distribution; the PDF uses Latin Modern instead.`,
            ),
          );
        }
        try {
          data = await compilePdf(pdflatex, document);
        } catch (error) {
          throw new UnprocessableEntityException(
            error instanceof LocalizedError ? error.text : localized(String(error), String(error)),
          );
        }
        break;
      }
    }

    return {
      fileName: `${safeFileName(book.title)}.${FORMATS[format].extension}`,
      extension: FORMATS[format].extension,
      mimeType: FORMATS[format].mimeType,
      data,
      // Gleiche Hinweise (z. B. dasselbe Bild mehrfach) nur einmal melden
      warnings: [...new Map(warnings.map((warning) => [warning.de, warning])).values()],
    };
  }

  private requireProject(): ProjectInfo {
    const project = this.projects.info();
    if (!project) {
      throw new ConflictException(
        localized('Es ist kein Projekt geöffnet.', 'No project is open.'),
      );
    }
    return project;
  }

  private book(project: ProjectInfo): Book {
    const rows = this.projects.db.prepare('SELECT node_id, doc FROM scene_content').all() as Array<{
      node_id: string;
      doc: string;
    }>;
    const docs = new Map(rows.map((row) => [row.node_id, JSON.parse(row.doc) as JsonNode]));
    return buildBook(
      { title: project.title, author: project.author },
      this.manuscript.list(),
      docs,
    );
  }

  /** Bilder im Text verweisen auf `/api/images/<id>` – für den Export die Daten dazu holen. */
  private imageResolver(): ImageResolver {
    return (src) => {
      const id = /^\/api\/images\/([0-9a-f-]{36})$/.exec(src)?.[1];
      if (!id) return null;
      try {
        const info = this.images.info(id);
        const { data } = this.images.data(id);
        // Ältere Uploads haben evtl. keine gespeicherten Maße – dann aus den Daten lesen.
        const measured = info.width && info.height ? null : imageSize(data);
        return {
          mimeType: info.mimeType,
          data,
          width: info.width ?? measured?.width ?? null,
          height: info.height ?? measured?.height ?? null,
        };
      } catch {
        return null;
      }
    };
  }
}

/** Schriften, für die mindestens eins ihrer TeX-Pakete installiert ist. */
async function availableFonts(pdflatex: PdflatexInstallation): Promise<Set<BookFont>> {
  const ids = Object.keys(BOOK_FONTS) as BookFont[];
  const packages = await findLatexPackages(
    pdflatex,
    ids.flatMap((id) => BOOK_FONTS[id].latex),
  );
  return new Set(ids.filter((id) => BOOK_FONTS[id].latex.some((name) => packages.has(name))));
}

/**
 * Stabile Kennung fürs EPUB: aus dem Anlagezeitpunkt des Buchs abgeleitet (ändert sich nicht,
 * auch wenn der Titel geändert wird), im Format einer UUID (Version 5).
 */
export function bookIdentifier(createdAt: string): string {
  const hash = createHash('sha1').update(`wortomat:${createdAt}`).digest();
  hash[6] = (hash[6]! & 0x0f) | 0x50;
  hash[8] = (hash[8]! & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `urn:uuid:${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
