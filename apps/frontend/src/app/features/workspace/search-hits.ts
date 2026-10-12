import type { SearchHit } from '@wortomat/shared';
import { NOTE_KINDS } from '../notes/note-kinds';

export interface HitGroup {
  kind: SearchHit['kind'];
  label: string;
  hits: SearchHit[];
}

/** Reihenfolge der Gruppen – wie in der Menüleiste. */
const GROUP_ORDER: ReadonlyArray<SearchHit['kind']> = ['scene', 'character', 'place', 'research'];

/**
 * Gruppiert Suchtreffer nach Bereich (Szenen, Charaktere, Orte, Forschung).
 * Innerhalb einer Gruppe bleibt die Relevanz-Reihenfolge des Backends erhalten.
 */
export function groupHits(hits: readonly SearchHit[]): HitGroup[] {
  return GROUP_ORDER.map((kind) => ({
    kind,
    label: kind === 'scene' ? 'Szenen' : NOTE_KINDS[kind].label,
    hits: hits.filter((hit) => hit.kind === kind),
  })).filter((group) => group.hits.length > 0);
}

/** Wohin ein Treffer führt. */
export function hitLink(hit: SearchHit): string[] {
  return hit.kind === 'scene'
    ? ['/write/scene', hit.id]
    : ['/write', NOTE_KINDS[hit.kind].path, hit.id];
}
