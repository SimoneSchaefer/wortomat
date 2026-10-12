import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  ExportCapabilities,
  ExportFormat,
  ExportRequest,
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
  safeFileName,
} from './book.js';
import { renderDocx } from './docx-renderer.js';
import { renderEpub } from './epub-renderer.js';
import { renderHtml } from './html-renderer.js';
import { renderLatex } from './latex-renderer.js';
import { compilePdf, findPdflatex } from './pdflatex.js';

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

export interface ExportedFile {
  fileName: string;
  extension: string;
  mimeType: string;
  data: Buffer;
  warnings: string[];
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
    return { pdf: { available: pdflatex !== null, version: pdflatex?.version ?? null } };
  }

  async export(request: ExportRequest): Promise<ExportedFile> {
    const format = request?.format;
    if (!format || !(format in FORMATS)) {
      throw new BadRequestException('Unbekanntes Exportformat.');
    }
    const template = TEMPLATES.includes(request.template) ? request.template : 'normseite';
    const options = { includeSceneTitles: request.includeSceneTitles === true };
    const project = this.projects.info();
    if (!project) {
      throw new ConflictException('Es ist kein Projekt geöffnet.');
    }
    const book = this.book(project);
    const images = this.imageResolver();

    let data: Buffer;
    let warnings: string[] = [];
    switch (format) {
      case 'html':
        data = renderHtml(book, options, images);
        break;
      case 'docx':
        ({ data, warnings } = await renderDocx(book, template, options, images));
        break;
      case 'epub':
        ({ data, warnings } = await renderEpub(book, options, images, {
          identifier: bookIdentifier(project.createdAt),
          modified: new Date(),
        }));
        break;
      case 'pdf': {
        const pdflatex = await findPdflatex();
        if (!pdflatex) {
          throw new ConflictException('pdfLaTeX wurde auf diesem Rechner nicht gefunden.');
        }
        const document = renderLatex(book, template, options, images);
        warnings = document.warnings;
        try {
          data = await compilePdf(pdflatex, document);
        } catch (error) {
          throw new UnprocessableEntityException(
            error instanceof Error ? error.message : String(error),
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
      warnings: [...new Set(warnings)],
    };
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
