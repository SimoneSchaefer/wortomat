import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import type {
  AddSceneStrandRequest,
  CreateStrandRequest,
  Strand,
  UpdateStrandRequest,
} from '@wortomat/shared';
import { StrandsService } from './strands.service.js';

@Controller()
export class StrandsController {
  constructor(private readonly strands: StrandsService) {}

  @Get('strands')
  list(): Strand[] {
    return this.strands.list();
  }

  @Post('strands')
  create(@Body() body: CreateStrandRequest): Strand {
    return this.strands.create(body?.name, body?.color);
  }

  @Patch('strands/:id')
  update(@Param('id') id: string, @Body() body: UpdateStrandRequest): Strand {
    return this.strands.update(id, body);
  }

  @Delete('strands/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.strands.remove(id);
  }

  @Get('scenes/:id/strands')
  forScene(@Param('id') sceneId: string): Strand[] {
    return this.strands.forScene(sceneId);
  }

  /** Mehrfaches Zuordnen ist unschädlich. Liefert alle Stränge der Szene. */
  @Post('scenes/:id/strands')
  add(@Param('id') sceneId: string, @Body() body: AddSceneStrandRequest): Strand[] {
    return this.strands.add(sceneId, body?.strandId);
  }

  @Delete('scenes/:id/strands/:strandId')
  removeFromScene(@Param('id') sceneId: string, @Param('strandId') strandId: string): Strand[] {
    return this.strands.removeFromScene(sceneId, strandId);
  }
}
