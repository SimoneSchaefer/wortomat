import { Controller, Get, Query } from '@nestjs/common';
import type { WritingDay } from '@wortomat/shared';
import { WritingLogService } from './writing-log.service.js';

@Controller('writing-log')
export class WritingLogController {
  constructor(private readonly log: WritingLogService) {}

  /** The day starts at 4 am. */
  @Get('today')
  today(): WritingDay {
    return this.log.today();
  }

  /** `from`/`to` (YYYY-MM-DD) are optional and inclusive. */
  @Get()
  days(@Query('from') from?: string, @Query('to') to?: string): WritingDay[] {
    return this.log.days(from, to);
  }
}
