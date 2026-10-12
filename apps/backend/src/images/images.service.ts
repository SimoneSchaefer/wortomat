import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ImageInfo, ImageMimeType } from '@wortomat/shared';
import { nowIso } from '../database/sqlite.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';

export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

export interface UploadedImage {
  buffer: Buffer;
  originalName?: string;
  width?: number;
  height?: number;
}

interface ImageRow {
  id: string;
  mime_type: ImageMimeType;
  width: number | null;
  height: number | null;
  byte_size: number;
  original_name: string | null;
}

@Injectable()
export class ImagesService {
  constructor(private readonly projects: ProjectService) {}

  save(upload: UploadedImage): ImageInfo {
    if (!upload.buffer?.length) {
      throw new BadRequestException(
        localized('Keine Bilddatei empfangen.', 'No image file received.'),
      );
    }
    // Den Typ aus den Dateiinhalten bestimmen, nicht aus Dateiname oder Header.
    const mimeType = detectImageType(upload.buffer);
    if (!mimeType) {
      throw new BadRequestException(
        localized(
          'Nicht unterstütztes Bildformat. Erlaubt sind JPEG, PNG, WebP, GIF und AVIF.',
          'Unsupported image format. Allowed are JPEG, PNG, WebP, GIF and AVIF.',
        ),
      );
    }

    const id = randomUUID();
    this.projects.db
      .prepare(
        `INSERT INTO images (id, mime_type, width, height, byte_size, original_name, data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        mimeType,
        positiveIntOrNull(upload.width),
        positiveIntOrNull(upload.height),
        upload.buffer.length,
        upload.originalName ?? null,
        upload.buffer,
        nowIso(),
      );
    return this.info(id);
  }

  /**
   * Löscht ein Bild aus der Projektdatei, sofern es nirgends mehr verwendet wird:
   * weder in einer Galerie noch als Titelbild noch im Text einer Szene oder Notiz.
   */
  deleteIfUnused(id: string): void {
    const reference = `%/api/images/${id}%`;
    const used = this.projects.db
      .prepare(
        `SELECT 1 FROM note_images WHERE image_id = ?
         UNION ALL SELECT 1 FROM project WHERE cover_image_id = ?
         UNION ALL SELECT 1 FROM scene_content WHERE doc LIKE ?
         UNION ALL SELECT 1 FROM notes WHERE doc LIKE ?
         LIMIT 1`,
      )
      .get(id, id, reference, reference);
    if (!used) {
      this.projects.db.prepare('DELETE FROM images WHERE id = ?').run(id);
    }
  }

  info(id: string): ImageInfo {
    const row = this.projects.db
      .prepare(
        'SELECT id, mime_type, width, height, byte_size, original_name FROM images WHERE id = ?',
      )
      .get(id) as ImageRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Bild nicht gefunden.', 'Image not found.'));
    }
    return {
      id: row.id,
      mimeType: row.mime_type,
      width: row.width,
      height: row.height,
      byteSize: row.byte_size,
      originalName: row.original_name,
      url: `/api/images/${row.id}`,
    };
  }

  data(id: string): { mimeType: ImageMimeType; data: Buffer } {
    const row = this.projects.db
      .prepare('SELECT mime_type, data FROM images WHERE id = ?')
      .get(id) as { mime_type: ImageMimeType; data: Uint8Array } | undefined;
    if (!row) {
      throw new NotFoundException(localized('Bild nicht gefunden.', 'Image not found.'));
    }
    return { mimeType: row.mime_type, data: Buffer.from(row.data) };
  }
}

function positiveIntOrNull(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** Erkennt das Bildformat anhand der „Magic Bytes“. */
export function detectImageType(buffer: Buffer): ImageMimeType | null {
  const ascii = (start: number, end: number) => buffer.subarray(start, end).toString('latin1');
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  return null;
}
