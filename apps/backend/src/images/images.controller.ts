import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ImageInfo } from '@wortomat/shared';
import type { Response } from 'express';
import { ImagesService, MAX_IMAGE_BYTES } from './images.service.js';

@Controller('images')
export class ImagesController {
  constructor(private readonly images: ImagesService) {}

  /**
   * Multipart upload: field `file` with the image, optionally `width` and `height` (the frontend
   * knows them anyway after resizing).
   */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { width?: string; height?: string },
  ): ImageInfo {
    return this.images.save({
      buffer: file?.buffer as Buffer,
      originalName: file?.originalname,
      width: Number(body.width),
      height: Number(body.height),
    });
  }

  @Get(':id')
  download(@Param('id') id: string, @Res({ passthrough: true }) res: Response): StreamableFile {
    const { mimeType, data } = this.images.data(id);
    // Images never change (a new image gets a new ID), so cache them forever.
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    return new StreamableFile(data, { type: mimeType, length: data.length });
  }

  @Get(':id/info')
  info(@Param('id') id: string): ImageInfo {
    return this.images.info(id);
  }
}
