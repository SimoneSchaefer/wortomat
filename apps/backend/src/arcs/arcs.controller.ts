import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import type {
  ArcStep,
  CharacterArc,
  CreateArcStepRequest,
  MoveArcStepRequest,
  ReorderArcStepsRequest,
  UpdateArcRequest,
  UpdateArcStepRequest,
} from '@wortomat/shared';
import { ArcsService } from './arcs.service.js';

@Controller()
export class ArcsController {
  constructor(private readonly arcs: ArcsService) {}

  @Get('notes/:id/arc')
  arc(@Param('id') noteId: string): CharacterArc {
    return this.arcs.arc(noteId);
  }

  @Put('notes/:id/arc')
  updateSummary(@Param('id') noteId: string, @Body() body: UpdateArcRequest): CharacterArc {
    return this.arcs.updateSummary(noteId, body?.summary);
  }

  @Post('notes/:id/arc/steps')
  createStep(@Param('id') noteId: string, @Body() body: CreateArcStepRequest): CharacterArc {
    return this.arcs.createStep(noteId, body);
  }

  @Put('notes/:id/arc/steps')
  reorderSteps(@Param('id') noteId: string, @Body() body: ReorderArcStepsRequest): CharacterArc {
    return this.arcs.reorderSteps(noteId, body?.stepIds);
  }

  @Patch('arc-steps/:id')
  updateStep(@Param('id') id: string, @Body() body: UpdateArcStepRequest): CharacterArc {
    return this.arcs.updateStep(id, body);
  }

  @Post('arc-steps/:id/move')
  @HttpCode(200)
  moveStep(@Param('id') id: string, @Body() body: MoveArcStepRequest): CharacterArc {
    return this.arcs.moveStep(id, body?.beforeId ?? null);
  }

  @Delete('arc-steps/:id')
  removeStep(@Param('id') id: string): CharacterArc {
    return this.arcs.removeStep(id);
  }

  @Get('scenes/:id/arc-steps')
  forScene(@Param('id') sceneId: string): ArcStep[] {
    return this.arcs.forScene(sceneId);
  }
}
