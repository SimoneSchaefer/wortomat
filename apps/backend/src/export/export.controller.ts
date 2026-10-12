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
import type { ExportCapabilities, ExportRequest, ExportResult } from '@wortomat/shared';
import type { Response } from 'express';
import { ExportService } from './export.service.js';

@Controller('export')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  /** Welche Formate gehen auf diesem Rechner? (PDF nur mit pdfLaTeX) */
  @Get('capabilities')
  capabilities(): Promise<ExportCapabilities> {
    return this.exporter.capabilities();
  }

  /**
   * Mit `filePath` (Desktop, aus dem Speichern-Dialog) wird die Datei dort geschrieben und
   * `ExportResult` geliefert; ohne Pfad (Browser-Modus) kommt die Datei als Download zurück,
   * Hinweise dann im Header `X-Export-Warnings` (URL-kodiertes JSON).
   */
  @Post()
  @HttpCode(200)
  async export(
    @Body() body: ExportRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExportResult | StreamableFile> {
    const file = await this.exporter.export(body);

    if (body.filePath !== undefined) {
      if (typeof body.filePath !== 'string' || !path.isAbsolute(body.filePath)) {
        throw new BadRequestException('Bitte einen vollständigen Dateipfad angeben.');
      }
      const extension = `.${file.extension}`;
      const filePath = body.filePath.toLowerCase().endsWith(extension)
        ? body.filePath
        : body.filePath + extension;
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, file.data);
      return { filePath, warnings: file.warnings };
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.setHeader('X-Export-Warnings', encodeURIComponent(JSON.stringify(file.warnings)));
    return new StreamableFile(file.data, { type: file.mimeType, length: file.data.length });
  }
}
