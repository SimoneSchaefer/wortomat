import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import type { LinkNoteRequest, NoteSummary, SceneReference } from '@wortomat/shared';
import { LinksService } from './links.service.js';

@Controller()
export class LinksController {
  constructor(private readonly links: LinksService) {}

  /** Charaktere, Orte … dieser Szene. */
  @Get('scenes/:id/links')
  notesForScene(@Param('id') sceneId: string): NoteSummary[] {
    return this.links.notesForScene(sceneId);
  }

  /** Verknüpft eine Notiz; mehrfaches Verknüpfen ist unschädlich. Liefert alle Verknüpfungen. */
  @Post('scenes/:id/links')
  link(@Param('id') sceneId: string, @Body() body: LinkNoteRequest): NoteSummary[] {
    if (typeof body?.noteId !== 'string' || !body.noteId) {
      throw new BadRequestException('Bitte eine Notiz angeben.');
    }
    return this.links.link(sceneId, body.noteId);
  }

  @Delete('scenes/:id/links/:noteId')
  unlink(@Param('id') sceneId: string, @Param('noteId') noteId: string): NoteSummary[] {
    return this.links.unlink(sceneId, noteId);
  }

  /** In welchen Szenen kommt dieser Charakter / Ort vor? */
  @Get('notes/:id/scenes')
  scenesForNote(@Param('id') noteId: string): SceneReference[] {
    return this.links.scenesForNote(noteId);
  }
}
