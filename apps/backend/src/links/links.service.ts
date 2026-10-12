import { Injectable } from '@nestjs/common';
import type { NoteSummary, SceneReference } from '@wortomat/shared';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { NotesService } from '../notes/notes.service.js';
import { ProjectService } from '../project/project.service.js';

/**
 * Verknüpfungen zwischen Szenen und Notizen (Charaktere, Orte …), in beide Richtungen.
 * Gelöscht wird automatisch per Fremdschlüssel, wenn Szene oder Notiz verschwinden.
 */
@Injectable()
export class LinksService {
  constructor(
    private readonly projects: ProjectService,
    private readonly manuscript: ManuscriptService,
    private readonly notes: NotesService,
  ) {}

  notesForScene(sceneId: string): NoteSummary[] {
    this.manuscript.requireScene(sceneId);
    return this.notes.linkedToScene(sceneId);
  }

  link(sceneId: string, noteId: string): NoteSummary[] {
    this.manuscript.requireScene(sceneId);
    this.notes.get(noteId);
    this.projects.db
      .prepare('INSERT OR IGNORE INTO scene_links (scene_id, note_id) VALUES (?, ?)')
      .run(sceneId, noteId);
    this.projects.touch();
    return this.notes.linkedToScene(sceneId);
  }

  unlink(sceneId: string, noteId: string): NoteSummary[] {
    this.manuscript.requireScene(sceneId);
    this.projects.db
      .prepare('DELETE FROM scene_links WHERE scene_id = ? AND note_id = ?')
      .run(sceneId, noteId);
    this.projects.touch();
    return this.notes.linkedToScene(sceneId);
  }

  /** Szenen, in denen die Notiz vorkommt – in Manuskript-Reihenfolge. */
  scenesForNote(noteId: string): SceneReference[] {
    this.notes.get(noteId);
    const rows = this.projects.db
      .prepare('SELECT scene_id FROM scene_links WHERE note_id = ?')
      .all(noteId) as Array<{ scene_id: string }>;
    return this.manuscript.sceneReferences(new Set(rows.map((row) => row.scene_id)));
  }
}
