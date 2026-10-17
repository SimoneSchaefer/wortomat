import { Controller, Delete, Get, HttpCode, Param, Post, Query, Req } from '@nestjs/common';
import type { RestoreResult, TrashEntry } from '@wortomat/shared';
import type { Request } from 'express';
import { requestLanguage } from '../i18n.js';
import { TrashService } from './trash.service.js';

@Controller('trash')
export class TrashController {
  constructor(private readonly trash: TrashService) {}

  @Get()
  list(): TrashEntry[] {
    return this.trash.list();
  }

  @Post(':id/restore')
  @HttpCode(200)
  restore(@Param('id') id: string, @Req() req: Request): RestoreResult {
    // The chapter title becomes part of the book, so it follows the UI language
    const chapterTitle = requestLanguage(req) === 'en' ? 'Restored' : 'Wiederhergestellt';
    return this.trash.restore(id, chapterTitle);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.trash.remove(id);
  }

  @Delete()
  @HttpCode(204)
  empty(@Query('area') area?: string): void {
    this.trash.empty(area);
  }
}
