import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import type {
  CreateProjectRequest,
  OpenProjectRequest,
  ProjectInfo,
  UpdateProjectRequest,
} from '@wortomat/shared';
import { ProjectService } from './project.service.js';

@Controller('project')
export class ProjectController {
  constructor(private readonly projects: ProjectService) {}

  /** Liefert das geöffnete Projekt oder `null`. */
  @Get()
  current(): ProjectInfo | null {
    return this.projects.info();
  }

  @Post('create')
  create(@Body() body: CreateProjectRequest): Promise<ProjectInfo> {
    return this.projects.create(body);
  }

  @Post('open')
  @HttpCode(200)
  open(@Body() body: OpenProjectRequest): ProjectInfo {
    return this.projects.open(body);
  }

  @Patch()
  update(@Body() body: UpdateProjectRequest): ProjectInfo {
    return this.projects.update(body);
  }

  @Post('close')
  @HttpCode(204)
  close(): void {
    this.projects.close();
  }
}
