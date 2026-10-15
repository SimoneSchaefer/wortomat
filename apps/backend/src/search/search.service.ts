import { Injectable } from '@nestjs/common';
import type { SearchHit } from '@wortomat/shared';
import { ProjectService } from '../project/project.service.js';

const MARK_START = '\u0001';
const MARK_END = '\u0002';

@Injectable()
export class SearchService {
  constructor(private readonly projects: ProjectService) {}

  /** Best hits first. */
  search(query: string, limit = 50): SearchHit[] {
    const match = toFtsQuery(query);
    if (!match) {
      return [];
    }
    // Snippets only from summary and text – the title is shown anyway. snippet() returns text even
    // without a hit in the column; the snippet then stays empty.
    const rows = this.projects.db
      .prepare(
        `SELECT 'scene' AS kind, node_id AS id, title,
                NULL AS summary_snippet,
                snippet(scene_fts, 2, :start, :end, '…', 16) AS body_snippet, rank
           FROM scene_fts
          WHERE scene_fts MATCH :match
         UNION ALL
         SELECT n.kind, f.note_id, f.title,
                snippet(note_fts, 2, :start, :end, '…', 16),
                snippet(note_fts, 3, :start, :end, '…', 16), f.rank
           FROM note_fts f
           JOIN notes n ON n.id = f.note_id
          WHERE note_fts MATCH :match
         ORDER BY rank
         LIMIT :limit`,
      )
      .all({ start: MARK_START, end: MARK_END, match, limit }) as Array<{
      kind: SearchHit['kind'];
      id: string;
      title: string;
      summary_snippet: string | null;
      body_snippet: string;
    }>;

    return rows.map((row) => {
      const snippet = [row.body_snippet, row.summary_snippet].find((text) =>
        text?.includes(MARK_START),
      );
      return {
        kind: row.kind,
        id: row.id,
        title: row.title,
        snippetHtml: snippet
          ? escapeHtml(snippet).replaceAll(MARK_START, '<mark>').replaceAll(MARK_END, '</mark>')
          : '',
      };
    });
  }
}

/** Every word is quoted (so no FTS syntax is possible) and searched as a prefix. */
export function toFtsQuery(input: string): string {
  return (input ?? '')
    .split(/\s+/)
    .map((term) => term.replaceAll('"', ''))
    .filter((term) => term.length > 0)
    .map((term) => `"${term}"*`)
    .join(' ');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
