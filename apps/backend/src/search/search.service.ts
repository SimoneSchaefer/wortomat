import { Injectable } from '@nestjs/common';
import type { SearchHit } from '@wortomat/shared';
import { ProjectService } from '../project/project.service.js';

const MARK_START = '\u0001';
const MARK_END = '\u0002';

@Injectable()
export class SearchService {
  constructor(private readonly projects: ProjectService) {}

  search(query: string, limit = 50): SearchHit[] {
    const match = toFtsQuery(query);
    if (!match) {
      return [];
    }
    const rows = this.projects.db
      .prepare(
        `SELECT node_id, title, snippet(scene_fts, 2, ?, ?, '…', 16) AS snippet
           FROM scene_fts
          WHERE scene_fts MATCH ?
          ORDER BY rank
          LIMIT ?`,
      )
      .all(MARK_START, MARK_END, match, limit) as Array<{
      node_id: string;
      title: string;
      snippet: string;
    }>;

    return rows.map((row) => ({
      nodeId: row.node_id,
      title: row.title,
      snippetHtml: escapeHtml(row.snippet)
        .replaceAll(MARK_START, '<mark>')
        .replaceAll(MARK_END, '</mark>'),
    }));
  }
}

/**
 * Wandelt Benutzereingaben in eine sichere FTS5-Abfrage um: Jedes Wort wird
 * in Anführungszeichen gesetzt (keine FTS-Syntax möglich) und als Präfix gesucht.
 */
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
