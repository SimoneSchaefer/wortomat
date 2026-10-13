import { Controller, Get } from '@nestjs/common';
import type { TextStatsResponse } from '@wortomat/shared';
import { TextStatsService } from './text-stats.service.js';

@Controller('text-stats')
export class TextStatsController {
  constructor(private readonly textStats: TextStatsService) {}

  /** Dialoganteil und Sätze je Szene, Füll- und Lieblingswörter des ganzen Buchs. */
  @Get()
  stats(): TextStatsResponse {
    return this.textStats.stats();
  }
}
