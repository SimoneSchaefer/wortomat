import type { SearchHit } from '@wortomat/shared';
import { groupHits, hitLink } from './search-hits';

const hit = (kind: SearchHit['kind'], id: string): SearchHit => ({
  kind,
  id,
  title: id,
  snippetHtml: '',
});

describe('Suchtreffer', () => {
  it('gruppiert nach Bereich in Menü-Reihenfolge und behält die Relevanz innerhalb der Gruppe', () => {
    const groups = groupHits([
      hit('place', 'hafen'),
      hit('scene', 's2'),
      hit('character', 'anna'),
      hit('scene', 's1'),
    ]);
    expect(groups.map((g) => [g.label, g.hits.map((h) => h.id)])).toEqual([
      ['Szenen', ['s2', 's1']],
      ['Charaktere', ['anna']],
      ['Orte', ['hafen']],
    ]);
  });

  it('verlinkt Szenen und Notizen auf ihre Seiten', () => {
    expect(hitLink(hit('scene', 'x'))).toEqual(['/write/scene', 'x']);
    expect(hitLink(hit('research', 'y'))).toEqual(['/write', 'research', 'y']);
  });
});
