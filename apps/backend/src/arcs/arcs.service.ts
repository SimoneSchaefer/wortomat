import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ArcStep,
  CharacterArc,
  CreateArcStepRequest,
  UpdateArcStepRequest,
} from '@wortomat/shared';
import { nowIso, transaction } from '../database/sqlite.js';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { NotesService } from '../notes/notes.service.js';
import { ProjectService } from '../project/project.service.js';
import { localized } from '../i18n.js';

const MAX_SUMMARY_LENGTH = 5000;
const MAX_LABEL_LENGTH = 200;
const MAX_DETAILS_LENGTH = 2000;

interface StepRow {
  id: string;
  note_id: string;
  label: string;
  details: string;
}

const STEP_COLUMNS = 'id, note_id, label, details';

/**
 * The stations keep the order the author gives them – it is the order of the development, which
 * need not match the book (flashbacks).
 */
@Injectable()
export class ArcsService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
    private readonly notes: NotesService,
  ) {}

  private get db() {
    return this.projects.db;
  }

  arc(noteId: string): CharacterArc {
    this.notes.get(noteId);
    const { arc } = this.db.prepare('SELECT arc FROM notes WHERE id = ?').get(noteId) as {
      arc: string;
    };
    const rows = this.db
      .prepare(`SELECT ${STEP_COLUMNS} FROM arc_steps WHERE note_id = ? ORDER BY sort_order`)
      .all(noteId) as unknown as StepRow[];
    return { noteId, summary: arc, steps: this.withScenes(rows) };
  }

  updateSummary(noteId: string, summary: unknown): CharacterArc {
    this.notes.get(noteId);
    if (typeof summary !== 'string') {
      throw new BadRequestException(localized('Ungültiger Text.', 'Invalid text.'));
    }
    this.db
      .prepare('UPDATE notes SET arc = ? WHERE id = ?')
      .run(summary.trim().slice(0, MAX_SUMMARY_LENGTH), noteId);
    this.projects.touch();
    return this.arc(noteId);
  }

  createStep(noteId: string, request: CreateArcStepRequest): CharacterArc {
    this.notes.get(noteId);
    const label = cleanLabel(request?.label ?? '');
    const sceneIds = request?.sceneIds ?? [];
    if (!Array.isArray(sceneIds)) {
      throw new BadRequestException(localized('Ungültige Szene.', 'Invalid scene.'));
    }
    for (const sceneId of sceneIds) this.requireScene(sceneId);
    const beforeId = request?.beforeId ?? null;
    transaction(this.db, () => {
      const id = randomUUID();
      this.db
        .prepare(
          `INSERT INTO arc_steps (id, note_id, label, sort_order, created_at)
           VALUES (?, ?, ?, 0, ?)`,
        )
        .run(id, noteId, label, nowIso());
      this.place(id, noteId, beforeId);
      for (const sceneId of sceneIds) this.insertScene(id, sceneId, noteId);
      this.projects.touch();
    });
    return this.arc(noteId);
  }

  updateStep(id: string, request: UpdateArcStepRequest): CharacterArc {
    const step = this.getStep(id);
    const label = request?.label === undefined ? step.label : cleanLabel(request.label);
    const details = request?.details === undefined ? step.details : cleanDetails(request.details);
    this.db
      .prepare('UPDATE arc_steps SET label = ?, details = ? WHERE id = ?')
      .run(label, details, id);
    this.projects.touch();
    return this.arc(step.noteId);
  }

  /** Adding a scene twice is harmless. */
  addScene(id: string, sceneId: unknown): CharacterArc {
    const step = this.getStep(id);
    this.requireScene(sceneId);
    transaction(this.db, () => {
      this.insertScene(id, sceneId as string, step.noteId);
      this.projects.touch();
    });
    return this.arc(step.noteId);
  }

  /** The character stays linked with the scene – it may appear there for other reasons. */
  removeScene(id: string, sceneId: string): CharacterArc {
    const step = this.getStep(id);
    this.db
      .prepare('DELETE FROM arc_step_scenes WHERE step_id = ? AND scene_id = ?')
      .run(id, sceneId);
    this.projects.touch();
    return this.arc(step.noteId);
  }

  moveStep(id: string, beforeId: unknown): CharacterArc {
    const step = this.getStep(id);
    if (beforeId !== null && (typeof beforeId !== 'string' || beforeId === id)) {
      throw new BadRequestException(
        localized('Ungültige Zielposition.', 'Invalid target position.'),
      );
    }
    transaction(this.db, () => {
      this.place(id, step.noteId, beforeId);
      this.projects.touch();
    });
    return this.arc(step.noteId);
  }

  /** Takes the complete list – a missing or foreign station is refused. */
  reorderSteps(noteId: string, stepIds: unknown): CharacterArc {
    this.notes.get(noteId);
    const current = (
      this.db.prepare('SELECT id FROM arc_steps WHERE note_id = ?').all(noteId) as Array<{
        id: string;
      }>
    ).map((row) => row.id);
    const valid =
      Array.isArray(stepIds) &&
      stepIds.length === current.length &&
      new Set(stepIds).size === stepIds.length &&
      stepIds.every((id) => current.includes(id));
    if (!valid) {
      throw new BadRequestException(
        localized(
          'Die Reihenfolge muss alle Stationen genau einmal enthalten.',
          'The order must contain every step exactly once.',
        ),
      );
    }
    transaction(this.db, () => {
      const setOrder = this.db.prepare('UPDATE arc_steps SET sort_order = ? WHERE id = ?');
      (stepIds as string[]).forEach((id, position) => setOrder.run(position + 1, id));
      this.projects.touch();
    });
    return this.arc(noteId);
  }

  removeStep(id: string): CharacterArc {
    const step = this.getStep(id);
    this.db.prepare('DELETE FROM arc_steps WHERE id = ?').run(id);
    this.projects.touch();
    return this.arc(step.noteId);
  }

  /** Stations of all characters that show in the scene, by character and then in arc order. */
  forScene(sceneId: string): ArcStep[] {
    this.manuscript.requireScene(sceneId);
    const rows = this.db
      .prepare(
        `SELECT a.id, a.note_id, a.label, a.details
           FROM arc_steps a
           JOIN arc_step_scenes s ON s.step_id = a.id
           JOIN notes n ON n.id = a.note_id
          WHERE s.scene_id = ?
          ORDER BY n.title COLLATE NOCASE, a.sort_order`,
      )
      .all(sceneId) as unknown as StepRow[];
    return this.withScenes(rows);
  }

  /** Renumbers all stations of the note with `id` before `beforeId` (`null` = at the end). */
  private place(id: string, noteId: string, beforeId: string | null): void {
    const others = (
      this.db
        .prepare('SELECT id FROM arc_steps WHERE note_id = ? AND id != ? ORDER BY sort_order')
        .all(noteId, id) as Array<{ id: string }>
    ).map((row) => row.id);
    const index = beforeId === null ? others.length : others.indexOf(beforeId);
    if (index < 0) {
      throw new NotFoundException(localized('Station nicht gefunden.', 'Arc step not found.'));
    }
    others.splice(index, 0, id);
    const setOrder = this.db.prepare('UPDATE arc_steps SET sort_order = ? WHERE id = ?');
    others.forEach((stepId, position) => setOrder.run(position + 1, stepId));
  }

  /** A station in a scene means the character appears there, so it gets linked too. */
  private insertScene(stepId: string, sceneId: string, noteId: string): void {
    this.db
      .prepare('INSERT OR IGNORE INTO arc_step_scenes (step_id, scene_id) VALUES (?, ?)')
      .run(stepId, sceneId);
    this.db
      .prepare('INSERT OR IGNORE INTO scene_links (scene_id, note_id) VALUES (?, ?)')
      .run(sceneId, noteId);
  }

  private requireScene(sceneId: unknown): void {
    if (typeof sceneId !== 'string' || !sceneId) {
      throw new BadRequestException(localized('Ungültige Szene.', 'Invalid scene.'));
    }
    this.manuscript.requireScene(sceneId);
  }

  private withScenes(rows: StepRow[]): ArcStep[] {
    const scenesOf = this.db.prepare(
      'SELECT scene_id FROM arc_step_scenes WHERE step_id = ? ORDER BY rowid',
    );
    return rows.map((row) => ({
      id: row.id,
      noteId: row.note_id,
      label: row.label,
      details: row.details,
      sceneIds: (scenesOf.all(row.id) as Array<{ scene_id: string }>).map((r) => r.scene_id),
    }));
  }

  private getStep(id: string): ArcStep {
    const row = this.db.prepare(`SELECT ${STEP_COLUMNS} FROM arc_steps WHERE id = ?`).get(id) as
      StepRow | undefined;
    if (!row) {
      throw new NotFoundException(localized('Station nicht gefunden.', 'Arc step not found.'));
    }
    return this.withScenes([row])[0]!;
  }
}

/** Empty is allowed: a new station is created first and named right after. */
function cleanLabel(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new BadRequestException(localized('Ungültiger Text.', 'Invalid text.'));
  }
  return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_LABEL_LENGTH);
}

function cleanDetails(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw new BadRequestException(localized('Ungültiger Text.', 'Invalid text.'));
  }
  return raw.trim().slice(0, MAX_DETAILS_LENGTH);
}
