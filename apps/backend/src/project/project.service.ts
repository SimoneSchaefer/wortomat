import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type {
  CreateProjectRequest,
  OpenProjectRequest,
  ProjectInfo,
  UpdateProjectRequest,
} from '@wortomat/shared';
import {
  APPLICATION_ID,
  configureConnection,
  migrate,
  readApplicationId,
} from '../database/schema.js';
import { nowIso } from '../database/sqlite.js';
import { RecentProjectsService } from './recent-projects.service.js';
import { LocalizedError, localized } from '../i18n.js';

const PROJECT_EXTENSION = '.wortomat';

interface OpenProject {
  db: DatabaseSync;
  filePath: string;
}

interface ProjectRow {
  title: string;
  author: string;
  cover_image_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hält die aktuell geöffnete Projektdatei. Es ist immer höchstens ein Projekt offen;
 * alle anderen Services greifen über {@link db} darauf zu.
 */
@Injectable()
export class ProjectService implements OnApplicationShutdown {
  private readonly logger = new Logger(ProjectService.name);
  private current: OpenProject | null = null;

  constructor(private readonly recent: RecentProjectsService) {}

  get db(): DatabaseSync {
    if (!this.current) {
      throw new ConflictException(
        localized('Es ist kein Projekt geöffnet.', 'No project is open.'),
      );
    }
    return this.current.db;
  }

  info(): ProjectInfo | null {
    if (!this.current) {
      return null;
    }
    const row = this.current.db
      .prepare(
        'SELECT title, author, cover_image_id, created_at, updated_at FROM project WHERE id = 1',
      )
      .get() as unknown as ProjectRow;
    return {
      filePath: this.current.filePath,
      title: row.title,
      author: row.author,
      coverImageId: row.cover_image_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async create(request: CreateProjectRequest): Promise<ProjectInfo> {
    const filePath = normalizeProjectPath(request.filePath);
    const title = request.title?.trim();
    if (!title) {
      throw new BadRequestException(
        localized('Bitte einen Titel angeben.', 'Please specify a title.'),
      );
    }
    if (existsSync(filePath)) {
      throw new ConflictException(
        localized(
          `Die Datei existiert bereits: ${filePath}`,
          `The file already exists: ${filePath}`,
        ),
      );
    }
    await mkdir(path.dirname(filePath), { recursive: true });

    const db = new DatabaseSync(filePath);
    try {
      configureConnection(db);
      db.exec(`PRAGMA application_id = ${APPLICATION_ID}`);
      migrate(db);
      const now = nowIso();
      db.prepare(
        'INSERT INTO project (id, title, author, created_at, updated_at) VALUES (1, ?, ?, ?, ?)',
      ).run(title, request.author?.trim() ?? '', now, now);
    } catch (error) {
      db.close();
      throw error;
    }

    this.replaceCurrent({ db, filePath });
    this.logger.log(`Projekt angelegt: ${filePath}`);
    return this.info()!;
  }

  open(request: OpenProjectRequest): ProjectInfo {
    const filePath = path.resolve(requirePath(request.filePath));
    if (!existsSync(filePath)) {
      throw new NotFoundException(
        localized(`Datei nicht gefunden: ${filePath}`, `File not found: ${filePath}`),
      );
    }

    let db: DatabaseSync;
    try {
      db = new DatabaseSync(filePath);
    } catch {
      throw new BadRequestException(
        localized('Die Datei konnte nicht geöffnet werden.', 'The file could not be opened.'),
      );
    }
    try {
      if (readApplicationId(db) !== APPLICATION_ID) {
        throw new BadRequestException(
          localized('Das ist keine Wortomat-Projektdatei.', 'This is not a Wortomat project file.'),
        );
      }
      configureConnection(db);
      migrate(db);
    } catch (error) {
      db.close();
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof LocalizedError
          ? error.text
          : error instanceof Error
            ? error.message
            : localized('Die Datei ist beschädigt.', 'The file is damaged.'),
      );
    }

    this.replaceCurrent({ db, filePath });
    this.logger.log(`Projekt geöffnet: ${filePath}`);
    return this.info()!;
  }

  update(request: UpdateProjectRequest): ProjectInfo {
    const title = request.title?.trim();
    if (request.title !== undefined && !title) {
      throw new BadRequestException(
        localized('Der Titel darf nicht leer sein.', 'The title must not be empty.'),
      );
    }
    const cover = request.coverImageId;
    if (cover !== undefined && cover !== null) {
      const exists =
        typeof cover === 'string' &&
        this.db.prepare('SELECT 1 FROM images WHERE id = ?').get(cover) !== undefined;
      if (!exists) {
        throw new BadRequestException(
          localized('Das Titelbild wurde nicht gefunden.', 'The cover image was not found.'),
        );
      }
      this.db.prepare('UPDATE project SET cover_image_id = ? WHERE id = 1').run(cover);
    } else if (cover === null) {
      this.db.prepare('UPDATE project SET cover_image_id = NULL WHERE id = 1').run();
    }
    this.db
      .prepare(
        `UPDATE project
            SET title = COALESCE(?, title),
                author = COALESCE(?, author),
                updated_at = ?
          WHERE id = 1`,
      )
      .run(title ?? null, request.author?.trim() ?? null, nowIso());
    return this.info()!;
  }

  /** Vermerkt eine Änderung am Projekt. */
  touch(): void {
    this.db.prepare('UPDATE project SET updated_at = ? WHERE id = 1').run(nowIso());
  }

  close(): void {
    if (!this.current) {
      return;
    }
    const { db, filePath } = this.current;
    this.current = null;
    try {
      // WAL-Inhalt in die Hauptdatei zurückschreiben, damit das Projekt wieder
      // aus genau einer Datei besteht (wichtig fürs Kopieren und Sichern).
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } finally {
      db.close();
    }
    this.logger.log(`Projekt geschlossen: ${filePath}`);
  }

  onApplicationShutdown(): void {
    this.close();
  }

  private replaceCurrent(next: OpenProject): void {
    this.close();
    this.current = next;
    try {
      this.recent.remember(next.filePath);
    } catch (error) {
      // Die Projektliste ist Komfort – ein Fehler dort darf das Öffnen nicht verhindern.
      this.logger.warn(`Projektliste konnte nicht aktualisiert werden: ${String(error)}`);
    }
  }
}

function requirePath(filePath: unknown): string {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new BadRequestException(
      localized('Bitte einen Dateipfad angeben.', 'Please specify a file path.'),
    );
  }
  return filePath.trim();
}

function normalizeProjectPath(filePath: unknown): string {
  const resolved = path.resolve(requirePath(filePath));
  return resolved.toLowerCase().endsWith(PROJECT_EXTENSION)
    ? resolved
    : resolved + PROJECT_EXTENSION;
}
