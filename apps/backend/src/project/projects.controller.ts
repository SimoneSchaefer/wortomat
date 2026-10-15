import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { ForgetProjectRequest, ProjectListEntry } from '@wortomat/shared';
import type { Response } from 'express';
import { ProjectService } from './project.service.js';
import { RecentProjectsService } from './recent-projects.service.js';
import { localized } from '../i18n.js';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly recent: RecentProjectsService,
    private readonly projects: ProjectService,
  ) {}

  @Get()
  list(): ProjectListEntry[] {
    return this.recent.list(this.projects.info()?.filePath ?? null);
  }

  /**
   * Reads it without opening the book. The image ID in the query makes the URL unique: a new cover
   * gets a new ID, so it may be cached for long.
   */
  @Get('cover')
  cover(
    @Query('filePath') filePath: unknown,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const cover = typeof filePath === 'string' && filePath ? this.recent.cover(filePath) : null;
    if (!cover) {
      throw new NotFoundException(localized('Kein Titelbild gefunden.', 'No cover image found.'));
    }
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    return new StreamableFile(cover.data, { type: cover.mimeType, length: cover.data.length });
  }

  /** The file itself is not deleted. */
  @Post('forget')
  @HttpCode(204)
  forget(@Body() body: ForgetProjectRequest): void {
    if (typeof body?.filePath !== 'string' || !body.filePath) {
      throw new BadRequestException(
        localized('Bitte einen Dateipfad angeben.', 'Please specify a file path.'),
      );
    }
    this.recent.forget(body.filePath);
  }
}
