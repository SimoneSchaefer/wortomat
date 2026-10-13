import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type { ProofImportResult, ProofNotesFile, ProofPackage } from '@wortomat/shared';
import { ProofreadingService } from './proofreading.service.js';

@Controller()
export class ProofreadingController {
  constructor(private readonly proofreading: ProofreadingService) {}

  /** Das Manuskript als reiner Text zum Korrekturlesen unterwegs. */
  @Get('proofreading/package')
  package(): ProofPackage {
    return this.proofreading.package();
  }

  /** Notizen aus der Korrekturfassung als Fixme-Markierungen ins Buch übernehmen. */
  @Post('proofreading/import')
  @HttpCode(200)
  import(@Body() body: ProofNotesFile): ProofImportResult {
    return this.proofreading.import(body);
  }
}
