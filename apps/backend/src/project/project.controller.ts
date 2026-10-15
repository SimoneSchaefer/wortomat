import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import type {
  CreateProjectRequest,
  OpenProjectRequest,
  ProjectInfo,
  UpdateProjectRequest,
} from '@wortomat/shared';
import { ImagesService } from '../images/images.service.js';
import { ProjectService } from './project.service.js';

@Controller('project')
export class ProjectController {
  constructor(
    private readonly projects: ProjectService,
    private readonly images: ImagesService,
  ) {}

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
    const previousCover = this.projects.info()?.coverImageId ?? null;
    const updated = this.projects.update(body);
    // Remove a replaced cover from the file if it is used nowhere else
    if (previousCover && previousCover !== updated.coverImageId) {
      this.images.deleteIfUnused(previousCover);
    }
    return updated;
  }

  @Post('close')
  @HttpCode(204)
  close(): void {
    this.projects.close();
  }
}
