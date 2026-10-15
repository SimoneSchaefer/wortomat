import type { SearchHit } from '@wortomat/shared';
import { groupHits, hitLink } from './search-hits';

const hit = (kind: SearchHit['kind'], id: string): SearchHit => ({
  kind,
  id,
  title: id,
  snippetHtml: '',
});

describe('search hits', () => {
  it('groups by area in menu order and keeps the relevance within a group', () => {
    const groups = groupHits([
      hit('place', 'hafen'),
      hit('scene', 's2'),
      hit('character', 'anna'),
      hit('scene', 's1'),
    ]);
    expect(groups.map((g) => [g.kind, g.hits.map((h) => h.id)])).toEqual([
      ['scene', ['s2', 's1']],
      ['character', ['anna']],
      ['place', ['hafen']],
    ]);
  });

  it('links scenes and notes to their pages', () => {
    expect(hitLink(hit('scene', 'x'))).toEqual(['/write/scene', 'x']);
    expect(hitLink(hit('research', 'y'))).toEqual(['/write', 'research', 'y']);
  });
});
