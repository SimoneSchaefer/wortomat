import type { SearchHit } from '@wortomat/shared';
import { NOTE_KINDS } from '../notes/note-kinds';

export interface HitGroup {
  kind: SearchHit['kind'];
  hits: SearchHit[];
}

/** Group order – as in the menu bar. */
const GROUP_ORDER: ReadonlyArray<SearchHit['kind']> = ['scene', 'character', 'place', 'research'];

/** Within a group the backend's relevance order is kept. */
export function groupHits(hits: readonly SearchHit[]): HitGroup[] {
  return GROUP_ORDER.map((kind) => ({
    kind,
    hits: hits.filter((hit) => hit.kind === kind),
  })).filter((group) => group.hits.length > 0);
}

export function hitLink(hit: SearchHit): string[] {
  return hit.kind === 'scene'
    ? ['/write/scene', hit.id]
    : ['/write', NOTE_KINDS[hit.kind].path, hit.id];
}
