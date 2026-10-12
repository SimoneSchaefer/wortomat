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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  CreateNoteGroupRequest,
  CreateNoteRequest,
  ImageInfo,
  NoteContent,
  NoteGroup,
  NoteKind,
  NoteSummary,
  ReorderImagesRequest,
  SaveDocumentRequest,
  UpdateNoteGroupRequest,
  UpdateNoteRequest,
} from '@wortomat/shared';
import { MAX_IMAGE_BYTES } from '../images/images.service.js';
import { NotesService } from './notes.service.js';

/** Gruppen der Notizliste, z. B. „Familie Berger“. */
@Controller('note-groups')
export class NoteGroupsController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(): NoteGroup[] {
    return this.notes.listGroups();
  }

  @Post()
  create(@Body() body: CreateNoteGroupRequest): NoteGroup {
    return this.notes.createGroup(body);
  }

  @Patch(':id')
  rename(@Param('id') id: string, @Body() body: UpdateNoteGroupRequest): NoteGroup {
    return this.notes.renameGroup(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.notes.removeGroup(id);
  }
}

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

  // Bildergalerie --------------------------------------------------------------

  @Get(':id/images')
  images(@Param('id') id: string): ImageInfo[] {
    return this.notes.galleryImages(id);
  }

  /** Multipart: Feld `file`, optional `width`/`height`. Liefert die ganze Galerie zurück. */
  @Post(':id/images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  addImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { width?: string; height?: string },
  ): ImageInfo[] {
    return this.notes.addImage(id, {
      buffer: file?.buffer as Buffer,
      originalName: file?.originalname,
      width: Number(body.width),
      height: Number(body.height),
    });
  }

  @Put(':id/images')
  reorderImages(@Param('id') id: string, @Body() body: ReorderImagesRequest): ImageInfo[] {
    return this.notes.reorderImages(id, body?.imageIds);
  }

  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string): ImageInfo[] {
    return this.notes.removeImage(id, imageId);
  }
}
