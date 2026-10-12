import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { AddTagRequest, Tag, TagSummary } from '@wortomat/shared';
import { TagsService } from './tags.service.js';

@Controller()
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  /** Alle verwendeten Tags des Projekts mit Anzahl der Szenen. */
  @Get('tags')
  list(): TagSummary[] {
    return this.tags.list();
  }

  @Get('scenes/:id/tags')
  forScene(@Param('id') sceneId: string): Tag[] {
    return this.tags.forScene(sceneId);
  }

  @Post('scenes/:id/tags')
  add(@Param('id') sceneId: string, @Body() body: AddTagRequest): Tag[] {
    return this.tags.add(sceneId, body?.name);
  }

  @Delete('scenes/:id/tags/:tagId')
  remove(@Param('id') sceneId: string, @Param('tagId') tagId: string): Tag[] {
    return this.tags.remove(sceneId, tagId);
  }
}
