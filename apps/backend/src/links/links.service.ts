import { Injectable } from '@nestjs/common';
import type { NoteSummary, SceneReference, SceneRelations } from '@wortomat/shared';
import { ManuscriptService } from '../manuscript/manuscript.service.js';
import { NotesService } from '../notes/notes.service.js';
import { ProjectService } from '../project/project.service.js';

/** Deleted automatically via foreign keys when the scene or note goes away. */
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

  relations(): SceneRelations[] {
    const db = this.projects.db;
    const result = new Map<string, SceneRelations>();
    const entry = (sceneId: string) => {
      let relations = result.get(sceneId);
      if (!relations) {
        relations = { sceneId, noteIds: [], tags: [], strandIds: [] };
        result.set(sceneId, relations);
      }
      return relations;
    };
    const links = db.prepare('SELECT scene_id, note_id FROM scene_links').all() as Array<{
      scene_id: string;
      note_id: string;
    }>;
    for (const row of links) entry(row.scene_id).noteIds.push(row.note_id);
    const tags = db
      .prepare(
        `SELECT st.scene_id, t.id, t.name FROM scene_tags st
         JOIN tags t ON t.id = st.tag_id
         ORDER BY t.name COLLATE NOCASE`,
      )
      .all() as Array<{ scene_id: string; id: string; name: string }>;
    for (const row of tags) entry(row.scene_id).tags.push({ id: row.id, name: row.name });
    const strands = db
      .prepare(
        `SELECT ss.scene_id, ss.strand_id FROM scene_strands ss
         JOIN strands s ON s.id = ss.strand_id
         ORDER BY s.sort_order`,
      )
      .all() as Array<{ scene_id: string; strand_id: string }>;
    for (const row of strands) entry(row.scene_id).strandIds.push(row.strand_id);
    return [...result.values()];
  }

  scenesForNote(noteId: string): SceneReference[] {
    this.notes.get(noteId);
    const rows = this.projects.db
      .prepare('SELECT scene_id FROM scene_links WHERE note_id = ?')
      .all(noteId) as Array<{ scene_id: string }>;
    return this.manuscript.sceneReferences(new Set(rows.map((row) => row.scene_id)));
  }
}
