import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type {
  CreateNodeRequest,
  ManuscriptNode,
  SaveSceneContentRequest,
  SceneContent,
  UpdateNodeRequest,
} from '@wortomat/shared';
import { ManuscriptService } from './manuscript.service.js';

@Controller()
export class ManuscriptController {
  constructor(private readonly manuscript: ManuscriptService) {}

  @Get('nodes')
  list(): ManuscriptNode[] {
    return this.manuscript.list();
  }

  @Post('nodes')
  create(@Body() body: CreateNodeRequest): ManuscriptNode {
    return this.manuscript.create(body);
  }

  @Patch('nodes/:id')
  update(@Param('id') id: string, @Body() body: UpdateNodeRequest): ManuscriptNode {
    return this.manuscript.update(id, body);
  }

  @Delete('nodes/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.manuscript.remove(id);
  }

  @Get('scenes/:id/content')
  getContent(@Param('id') id: string): SceneContent {
    return this.manuscript.getContent(id);
  }

  @Put('scenes/:id/content')
  saveContent(@Param('id') id: string, @Body() body: SaveSceneContentRequest): SceneContent {
    return this.manuscript.saveContent(id, body);
  }
}
