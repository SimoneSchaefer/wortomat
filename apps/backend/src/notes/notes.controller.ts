import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type {
  CreateNoteRequest,
  NoteContent,
  NoteKind,
  NoteSummary,
  SaveDocumentRequest,
  UpdateNoteRequest,
} from '@wortomat/shared';
import { NotesService } from './notes.service.js';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  /** Alle Notizen oder nur eine Art (`?kind=character`). */
  @Get()
  list(@Query('kind') kind?: NoteKind): NoteSummary[] {
    return this.notes.list(kind);
  }

  @Post()
  create(@Body() body: CreateNoteRequest): NoteSummary {
    return this.notes.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateNoteRequest): NoteSummary {
    return this.notes.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.notes.remove(id);
  }

  @Get(':id/content')
  getContent(@Param('id') id: string): NoteContent {
    return this.notes.getContent(id);
  }

  @Put(':id/content')
  saveContent(@Param('id') id: string, @Body() body: SaveDocumentRequest): NoteContent {
    return this.notes.saveContent(id, body);
  }
}
