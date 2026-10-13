import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateMapRequest,
  MapPin,
  MapStroke,
  MapSummary,
  PlaceMap,
  UpdateMapRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ImagesService } from '../images/images.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';

/** Zeichenfläche einer neuen Karte (Querformat); das Frontend rechnet in diesen Einheiten. */
const DEFAULT_WIDTH = 1600;
const DEFAULT_HEIGHT = 1000;
const MIN_SIZE = 100;
const MAX_SIZE = 10_000;
/** Großzügig – eine grobe Karte hat eher Hunderte als Tausende Striche. */
const MAX_STROKES = 20_000;
const MAX_POINTS_PER_STROKE = 20_000;
const MAX_STROKE_WIDTH = 200;

interface MapRow {
  id: string;
  name: string;
  width: number;
  height: number;
  background_image_id: string | null;
  background_opacity: number;
  strokes: string;
  updated_at: string;
}

/** Grob gezeichnete Landkarten mit eingezeichneten Orten. */
@Injectable()
export class MapsService {
  constructor(
    private readonly projects: ProjectService,
    private readonly images: ImagesService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  /** In der Reihenfolge, in der sie angelegt wurden. */
  list(): MapSummary[] {
    const rows = this.db
      .prepare('SELECT id, name, updated_at FROM maps ORDER BY created_at, id')
      .all() as Array<{ id: string; name: string; updated_at: string }>;
    return rows.map((row) => ({ id: row.id, name: row.name, updatedAt: row.updated_at }));
  }

  /** Karten, auf denen der Ort eingezeichnet ist – komplett, damit sie als Vorschau passen. */
  containing(noteId: string): PlaceMap[] {
    const rows = this.db
      .prepare(
        `SELECT maps.id FROM map_pins JOIN maps ON maps.id = map_pins.map_id
          WHERE map_pins.note_id = ? ORDER BY maps.created_at, maps.id`,
      )
      .all(noteId) as Array<{ id: string }>;
    return rows.map((row) => this.get(row.id));
  }

  create(request: CreateMapRequest): PlaceMap {
    const name = requireName(request?.name);
    const id = randomUUID();
    const now = nowIso();
    transaction(this.db, () => {
      this.db
        .prepare(
          `INSERT INTO maps (id, name, width, height, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run(id, name, DEFAULT_WIDTH, DEFAULT_HEIGHT, now, now);
      this.projects.touch();
    });
    return this.get(id);
  }

  get(id: string): PlaceMap {
    const row = this.db
      .prepare(
        `SELECT id, name, width, height, background_image_id, background_opacity, strokes,
                updated_at
           FROM maps WHERE id = ?`,
      )
      .get(id) as MapRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Karte nicht gefunden.', 'Map not found.'));
    }
    const pins = this.db
      .prepare('SELECT note_id AS noteId, x, y FROM map_pins WHERE map_id = ? ORDER BY rowid')
      .all(id) as unknown as MapPin[];
    return {
      id: row.id,
      name: row.name,
      updatedAt: row.updated_at,
      width: row.width,
      height: row.height,
      backgroundImageId: row.background_image_id,
      backgroundOpacity: row.background_opacity,
      strokes: JSON.parse(row.strokes) as MapStroke[],
      pins: pins.map((pin) => ({ ...pin })),
    };
  }

  update(id: string, request: UpdateMapRequest): PlaceMap {
    const map = this.get(id);
    const name = request?.name === undefined ? map.name : requireName(request.name);
    const width = request?.width === undefined ? map.width : requireSize(request.width);
    const height = request?.height === undefined ? map.height : requireSize(request.height);
    const backgroundImageId =
      request?.backgroundImageId === undefined
        ? map.backgroundImageId
        : this.requireImage(request.backgroundImageId);
    const backgroundOpacity =
      request?.backgroundOpacity === undefined
        ? map.backgroundOpacity
        : requireOpacity(request.backgroundOpacity);
    const strokes = request?.strokes === undefined ? null : requireStrokes(request.strokes);
    const pins = request?.pins === undefined ? null : requirePins(request.pins);

    transaction(this.db, () => {
      this.db
        .prepare(
          `UPDATE maps SET name = ?, width = ?, height = ?, background_image_id = ?,
                  background_opacity = ?, strokes = COALESCE(?, strokes), updated_at = ?
            WHERE id = ?`,
        )
        .run(
          name,
          width,
          height,
          backgroundImageId,
          backgroundOpacity,
          strokes && JSON.stringify(strokes),
          nowIso(),
          id,
        );
      if (pins) this.replacePins(id, pins);
      if (map.backgroundImageId && map.backgroundImageId !== backgroundImageId) {
        this.images.deleteIfUnused(map.backgroundImageId);
      }
      this.projects.touch();
    });
    return this.get(id);
  }

  remove(id: string): void {
    const map = this.get(id);
    transaction(this.db, () => {
      this.db.prepare('DELETE FROM maps WHERE id = ?').run(id); // Orte per CASCADE
      if (map.backgroundImageId) this.images.deleteIfUnused(map.backgroundImageId);
      this.projects.touch();
    });
  }

  /**
   * Ersetzt alle Orte der Karte. Unbekannte Notizen werden still übergangen – etwa ein Ort,
   * der gelöscht wurde, während die Karte noch offen war.
   */
  private replacePins(id: string, pins: MapPin[]): void {
    this.db.prepare('DELETE FROM map_pins WHERE map_id = ?').run(id);
    const isPlace = this.db.prepare("SELECT 1 FROM notes WHERE id = ? AND kind = 'place'");
    const insert = this.db.prepare(
      'INSERT OR REPLACE INTO map_pins (map_id, note_id, x, y) VALUES (?, ?, ?, ?)',
    );
    for (const pin of pins) {
      if (isPlace.get(pin.noteId)) insert.run(id, pin.noteId, pin.x, pin.y);
    }
  }

  private requireImage(imageId: unknown): string | null {
    if (imageId === null) return null;
    const exists =
      typeof imageId === 'string' &&
      this.db.prepare('SELECT 1 FROM images WHERE id = ?').get(imageId);
    if (!exists) {
      throw new BadRequestException(localized('Bild nicht gefunden.', 'Image not found.'));
    }
    return imageId as string;
  }
}

function invalid(): BadRequestException {
  return new BadRequestException(localized('Ungültige Kartendaten.', 'Invalid map data.'));
}

function requireName(name: unknown): string {
  if (typeof name !== 'string' || !name.trim()) {
    throw new BadRequestException(
      localized('Der Name darf nicht leer sein.', 'The name must not be empty.'),
    );
  }
  return name.trim().slice(0, 200);
}

function requireSize(value: unknown): number {
  if (typeof value !== 'number' || !(value >= MIN_SIZE && value <= MAX_SIZE)) throw invalid();
  return Math.round(value);
}

function requireOpacity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid();
  return Math.min(1, Math.max(0.1, value));
}

/** Auf eine Nachkommastelle gerundet – genauer zeichnet niemand, und die Datei bleibt klein. */
function coordinate(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw invalid();
  return Math.round(value * 10) / 10;
}

function requireStrokes(strokes: unknown): MapStroke[] {
  if (!Array.isArray(strokes) || strokes.length > MAX_STROKES) throw invalid();
  return strokes.map((stroke: Partial<MapStroke> | null): MapStroke => {
    const { tool, color, width, points } = stroke ?? {};
    if (
      (tool !== 'pen' && tool !== 'area') ||
      typeof color !== 'string' ||
      !/^#[0-9a-f]{6}$/i.test(color) ||
      typeof width !== 'number' ||
      !(width > 0 && width <= MAX_STROKE_WIDTH) ||
      !Array.isArray(points) ||
      points.length < 2 ||
      points.length % 2 !== 0 ||
      points.length > 2 * MAX_POINTS_PER_STROKE
    ) {
      throw invalid();
    }
    return { tool, color: color.toLowerCase(), width, points: points.map(coordinate) };
  });
}

function requirePins(pins: unknown): MapPin[] {
  if (!Array.isArray(pins)) throw invalid();
  return pins.map((pin: Partial<MapPin> | null): MapPin => {
    if (typeof pin?.noteId !== 'string') throw invalid();
    return { noteId: pin.noteId, x: coordinate(pin.x), y: coordinate(pin.y) };
  });
}
