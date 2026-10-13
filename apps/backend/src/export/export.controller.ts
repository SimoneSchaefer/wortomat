import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type {
  ExportCapabilities,
  ExportPreview,
  ExportRequest,
  ExportResult,
  ExportSettings,
  ExportSettingsResponse,
} from '@wortomat/shared';
import type { Request, Response } from 'express';
import { ExportService } from './export.service.js';
import { localized, requestLanguage } from '../i18n.js';

@Controller('export')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  /** Welche Formate gehen auf diesem Rechner? (PDF nur mit pdfLaTeX) */
  @Get('capabilities')
  capabilities(): Promise<ExportCapabilities> {
    return this.exporter.capabilities();
  }

  /** Was der Export-Dialog sich für dieses Buch gemerkt hat. */
  @Get('settings')
  settings(): ExportSettingsResponse {
    return this.exporter.settings();
  }

  @Put('settings')
  saveSettings(@Body() body: unknown): ExportSettings {
    return this.exporter.saveSettings(body);
  }

  /** Schriftdatei (OpenType) für die Vorschau, z. B. `fonts/garamond/italic`. */
  @Get('fonts/:font/:style')
  async font(
    @Param('font') font: string,
    @Param('style') style: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.exporter.fontFile(font, style);
    if (!file) {
      throw new NotFoundException(
        localized('Diese Schrift ist nicht installiert.', 'This font is not installed.'),
      );
    }
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.type('font/otf');
    res.sendFile(file);
  }

  /** Titel und erstes Kapitel für die Seitenvorschau im Dialog. */
  @Get('preview')
  preview(@Query('sceneTitles') sceneTitles?: string): ExportPreview {
    return this.exporter.preview(sceneTitles === 'true');
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ExportResult | StreamableFile> {
    const file = await this.exporter.export(body);
    const language = requestLanguage(req);
    const warnings = file.warnings.map((warning) => warning[language]);

    if (body.filePath !== undefined) {
      if (typeof body.filePath !== 'string' || !path.isAbsolute(body.filePath)) {
        throw new BadRequestException(
          localized(
            'Bitte einen vollständigen Dateipfad angeben.',
            'Please specify a complete file path.',
          ),
        );
      }
      const extension = `.${file.extension}`;
      const filePath = body.filePath.toLowerCase().endsWith(extension)
        ? body.filePath
        : body.filePath + extension;
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, file.data);
      return { filePath, warnings };
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.setHeader('X-Export-Warnings', encodeURIComponent(JSON.stringify(warnings)));
    return new StreamableFile(file.data, { type: file.mimeType, length: file.data.length });
  }
}
