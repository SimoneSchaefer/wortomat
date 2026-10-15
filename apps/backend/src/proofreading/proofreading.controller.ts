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
  ProofInbox,
  ProofNotesFile,
  ProofPackage,
} from '@wortomat/shared';
import type { Response } from 'express';
import { localized } from '../i18n.js';
import { ProofreadingService } from './proofreading.service.js';

@Controller()
export class ProofreadingController {
  constructor(private readonly proofreading: ProofreadingService) {}

  @Get('proofreading/package')
  package(): ProofPackage {
    return this.proofreading.package();
  }

  /**
   * With `filePath` (desktop, from the save dialog) it is written there; without a path (browser
   * mode) it comes back as a download.
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

  @Get('proofreading/inbox')
  inbox(): ProofInbox {
    return this.proofreading.inbox();
  }

  @Post('proofreading/inbox/import')
  @HttpCode(200)
  importInbox(): ProofImportResult {
    return this.proofreading.importInbox();
  }

  /** Returns the names of the deleted files. */
  @Post('proofreading/inbox/clean')
  @HttpCode(200)
  cleanInbox(): { deleted: string[] } {
    return { deleted: this.proofreading.cleanInbox() };
  }

  @Post('proofreading/import')
  @HttpCode(200)
  import(@Body() body: ProofNotesFile): ProofImportResult {
    return this.proofreading.import(body);
  }
}
