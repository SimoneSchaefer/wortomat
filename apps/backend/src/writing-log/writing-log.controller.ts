import { Controller, Get, Query } from '@nestjs/common';
import type { WritingDay } from '@wortomat/shared';
import { WritingLogService } from './writing-log.service.js';

@Controller('writing-log')
export class WritingLogController {
  constructor(private readonly log: WritingLogService) {}

  /** Was heute geschrieben wurde; der Tag beginnt um 4 Uhr. */
  @Get('today')
  today(): WritingDay {
    return this.log.today();
  }

  /** Geschriebene Wörter je Tag; `from`/`to` (YYYY-MM-DD) sind optional und inklusive. */
  @Get()
  days(@Query('from') from?: string, @Query('to') to?: string): WritingDay[] {
    return this.log.days(from, to);
  }
}
