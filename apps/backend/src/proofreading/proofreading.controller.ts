import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type {
  ExportResult,
  ProofExportRequest,
  ProofImportResult,
  ProofNotesFile,
  ProofPackage,
} from '@wortomat/shared';
import type { Response } from 'express';
import { localized } from '../i18n.js';
import { ProofreadingService } from './proofreading.service.js';

@Controller()
export class ProofreadingController {
  constructor(private readonly proofreading: ProofreadingService) {}

  /** Das Manuskript als reiner Text zum Korrekturlesen unterwegs. */
  @Get('proofreading/package')
  package(): ProofPackage {
    return this.proofreading.package();
  }

  /**
   * Die Korrekturfassung als HTML-Datei fürs Handy. Mit `filePath` (Desktop, aus dem
   * Speichern-Dialog) wird sie dort geschrieben, ohne Pfad (Browser-Modus) kommt sie als Download.
   */
  @Post('proofreading/export')
  @HttpCode(200)
  async export(
    @Body() body: ProofExportRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExportResult | StreamableFile> {
    const file = this.proofreading.readerFile();
    const data = Buffer.from(file.html, 'utf8');
    if (body?.filePath !== undefined) {
      if (typeof body.filePath !== 'string' || !path.isAbsolute(body.filePath)) {
        throw new BadRequestException(
          localized(
            'Bitte einen vollständigen Dateipfad angeben.',
            'Please specify a complete file path.',
          ),
        );
      }
      const filePath = body.filePath.toLowerCase().endsWith('.html')
        ? body.filePath
        : `${body.filePath}.html`;
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, data);
      return { filePath, warnings: [] };
    }
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    return new StreamableFile(data, { type: 'text/html; charset=utf-8', length: data.length });
  }

  /** Notizen aus der Korrekturfassung als Fixme-Markierungen ins Buch übernehmen. */
  @Post('proofreading/import')
  @HttpCode(200)
  import(@Body() body: ProofNotesFile): ProofImportResult {
    return this.proofreading.import(body);
  }
}
