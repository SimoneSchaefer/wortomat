import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ImageMimeType, ProjectListEntry } from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';
import { APPLICATION_ID, readApplicationId } from '../database/schema.js';
import { nowIso } from '../database/sqlite.js';

const LIST_FILE = 'projects.json';
const MAX_ENTRIES = 200;

interface StoredEntry {
  filePath: string;
  lastOpenedAt: string;
}

interface StoredList {
  version: 1;
  projects: StoredEntry[];
}

interface ProjectSummary {
  title: string;
  author: string;
  updatedAt: string;
  wordCount: number;
  coverImageId: string | null;
}

/**
 * Merkt sich alle Projektdateien, die angelegt oder geöffnet wurden – egal wo sie liegen.
 * Die Liste enthält nur Pfade; Titel & Co. werden bei jeder Abfrage frisch aus den
 * Dateien gelesen und sind daher nie veraltet.
 */
@Injectable()
export class RecentProjectsService {
  private readonly logger = new Logger(RecentProjectsService.name);
  private readonly listFile: string;

  constructor(@Inject(SERVER_OPTIONS) options: ServerOptions) {
    this.listFile = path.join(options.dataDir, LIST_FILE);
  }

  list(openFilePath: string | null): ProjectListEntry[] {
    return this.read()
      .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
      .map((entry) => {
        const summary = readSummary(entry.filePath);
        return {
          filePath: entry.filePath,
          title: summary?.title ?? path.basename(entry.filePath, path.extname(entry.filePath)),
          author: summary?.author ?? '',
          available: summary !== null,
          isOpen: openFilePath !== null && samePath(entry.filePath, openFilePath),
          wordCount: summary?.wordCount ?? 0,
          coverImageId: summary?.coverImageId ?? null,
          updatedAt: summary?.updatedAt ?? null,
          lastOpenedAt: entry.lastOpenedAt,
        };
      });
  }

  /**
   * Liest das Titelbild eines Buchs aus der Liste – auch wenn es gerade nicht geöffnet ist.
   * Nur für Dateien, die in der Liste stehen, damit sich so keine beliebigen Dateien lesen lassen.
   */
  cover(filePath: string): { mimeType: ImageMimeType; data: Buffer } | null {
    if (!this.read().some((entry) => samePath(entry.filePath, filePath))) {
      return null;
    }
    return readCover(filePath);
  }

  remember(filePath: string): void {
    const entries = this.read().filter((entry) => !samePath(entry.filePath, filePath));
    entries.unshift({ filePath, lastOpenedAt: nowIso() });
    this.write(entries.slice(0, MAX_ENTRIES));
  }

  /** Entfernt den Eintrag aus der Liste. Die Datei selbst bleibt unangetastet. */
  forget(filePath: string): void {
    this.write(this.read().filter((entry) => !samePath(entry.filePath, filePath)));
  }

  private read(): StoredEntry[] {
    if (!existsSync(this.listFile)) {
      return [];
    }
    try {
      const data = JSON.parse(readFileSync(this.listFile, 'utf8')) as StoredList;
      return Array.isArray(data.projects)
        ? data.projects.filter((entry) => typeof entry?.filePath === 'string')
        : [];
    } catch (error) {
      // Kaputte Liste beiseitelegen statt die App zu blockieren; die Bücher selbst sind sicher.
      const backup = `${this.listFile}.${Date.now()}.defekt`;
      this.logger.warn(`Projektliste unlesbar, verschoben nach ${backup}: ${String(error)}`);
      renameSync(this.listFile, backup);
      return [];
    }
  }

  private write(projects: StoredEntry[]): void {
    mkdirSync(path.dirname(this.listFile), { recursive: true });
    const data: StoredList = { version: 1, projects };
    // Erst in eine Temp-Datei schreiben, dann umbenennen: nie eine halb geschriebene Liste.
    const tmpFile = `${this.listFile}.tmp`;
    writeFileSync(tmpFile, JSON.stringify(data, null, 2));
    renameSync(tmpFile, this.listFile);
  }
}

/** Liest Titel & Co. direkt aus der Projektdatei (nur lesend). `null` = nicht verfügbar. */
function readSummary(filePath: string): ProjectSummary | null {
  if (!existsSync(filePath)) {
    return null;
  }
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(filePath, { readOnly: true });
    if (readApplicationId(db) !== APPLICATION_ID) {
      return null;
    }
    const project = db
      .prepare('SELECT title, author, cover_image_id, updated_at FROM project WHERE id = 1')
      .get() as
      | { title: string; author: string; cover_image_id: string | null; updated_at: string }
      | undefined;
    if (!project) {
      return null;
    }
    const { words } = db
      .prepare('SELECT COALESCE(SUM(word_count), 0) AS words FROM scene_content')
      .get() as { words: number };
    return {
      title: project.title,
      author: project.author,
      updatedAt: project.updated_at,
      wordCount: words,
      coverImageId: project.cover_image_id,
    };
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

function readCover(filePath: string): { mimeType: ImageMimeType; data: Buffer } | null {
  if (!existsSync(filePath)) {
    return null;
  }
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(filePath, { readOnly: true });
    if (readApplicationId(db) !== APPLICATION_ID) {
      return null;
    }
    const row = db
      .prepare(
        `SELECT images.mime_type, images.data FROM project
         JOIN images ON images.id = project.cover_image_id WHERE project.id = 1`,
      )
      .get() as { mime_type: ImageMimeType; data: Uint8Array } | undefined;
    return row ? { mimeType: row.mime_type, data: Buffer.from(row.data) } : null;
  } catch {
    return null;
  } finally {
    db?.close();
  }
}

/** Windows und macOS unterscheiden bei Pfaden standardmäßig keine Groß-/Kleinschreibung. */
function samePath(a: string, b: string): boolean {
  const normalize = (p: string) => {
    const resolved = path.resolve(p);
    return process.platform === 'linux' ? resolved : resolved.toLowerCase();
  };
  return normalize(a) === normalize(b);
}
