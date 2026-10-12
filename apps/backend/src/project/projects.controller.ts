import { BadRequestException, Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import type { ForgetProjectRequest, ProjectListEntry } from '@wortomat/shared';
import { ProjectService } from './project.service.js';
import { RecentProjectsService } from './recent-projects.service.js';

/** Liste aller bekannten Projekte für die Startseite. */
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

  /** Nimmt ein Projekt aus der Liste, ohne die Datei zu löschen. */
  @Post('forget')
  @HttpCode(204)
  forget(@Body() body: ForgetProjectRequest): void {
    if (typeof body?.filePath !== 'string' || !body.filePath) {
      throw new BadRequestException('Bitte einen Dateipfad angeben.');
    }
    this.recent.forget(body.filePath);
  }
}
