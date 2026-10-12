import type { ManuscriptNode } from '@wortomat/shared';
import { buildTree } from '../../core/project-store';
import {
  countScenes,
  filterTree,
  matchesScene,
  NO_FILTER,
  type SceneFilterCriteria,
  type SceneLinksInfo,
} from './scene-filter';

const node = (
  id: string,
  kind: ManuscriptNode['kind'],
  parentId: string | null,
  extra: Partial<ManuscriptNode> = {},
): ManuscriptNode => ({
  id,
  parentId,
  kind,
  title: id,
  sortOrder: 0,
  wordCount: 0,
  status: kind === 'scene' ? 'idea' : null,
  annotations: kind === 'scene' ? { todo: 0, idea: 0, fixme: 0 } : null,
  ...extra,
});

const links = (noteIds: string[], tagIds: string[] = []): SceneLinksInfo => ({
  noteIds: new Set(noteIds),
  tags: tagIds.map((id) => ({ id, name: id })),
});

const KINDS: Record<string, string> = { anna: 'character', ben: 'character', hafen: 'place' };
const kindOf = (id: string) => KINDS[id];
const filter = (patch: Partial<SceneFilterCriteria>) => ({ ...NO_FILTER, ...patch });

describe('matchesScene', () => {
  const scene = node('s', 'scene', 'k', {
    status: 'draft',
    annotations: { todo: 2, idea: 0, fixme: 0 },
  });
  const sceneLinks = links(['anna', 'hafen'], ['rückblende']);
  const matches = (criteria: SceneFilterCriteria) =>
    matchesScene(scene, criteria, sceneLinks, kindOf);

  it('prüft Status und offene Markierungen – eins aus der Gruppe genügt', () => {
    expect(matches(filter({ statuses: ['draft'] }))).toBe(true);
    expect(matches(filter({ statuses: ['idea', 'final'] }))).toBe(false);
    expect(matches(filter({ annotations: ['fixme', 'todo'] }))).toBe(true);
    expect(matches(filter({ annotations: ['idea'] }))).toBe(false);
  });

  it('verlangt je Art (Charakter, Ort) eine der gewählten Notizen', () => {
    expect(matches(filter({ noteIds: ['anna', 'ben'] }))).toBe(true);
    expect(matches(filter({ noteIds: ['ben'] }))).toBe(false);
    expect(matches(filter({ noteIds: ['ben', 'hafen'] }))).toBe(false);
    expect(matches(filter({ noteIds: ['anna', 'hafen'] }))).toBe(true);
    // Gelöschte Notizen schränken nichts ein
    expect(matches(filter({ noteIds: ['gelöscht'] }))).toBe(true);
  });

  it('verknüpft die Gruppen mit „und“', () => {
    expect(matches(filter({ statuses: ['draft'], tagIds: ['rückblende'] }))).toBe(true);
    expect(matches(filter({ statuses: ['draft'], tagIds: ['spannung'] }))).toBe(false);
  });

  it('behandelt Szenen ohne Verknüpfungen', () => {
    expect(matchesScene(scene, filter({ tagIds: ['x'] }), undefined, kindOf)).toBe(false);
    expect(matchesScene(scene, filter({ statuses: ['draft'] }), undefined, kindOf)).toBe(true);
  });
});

describe('filterTree', () => {
  it('blendet Kapitel ohne Treffer aus und summiert nur Sichtbares', () => {
    const tree = buildTree([
      node('teil', 'part', null),
      node('k1', 'chapter', 'teil'),
      node('a', 'scene', 'k1', { wordCount: 100, status: 'draft' }),
      node('b', 'scene', 'k1', { wordCount: 50 }),
      node('k2', 'chapter', 'teil'),
      node('c', 'scene', 'k2', { wordCount: 70 }),
    ]);
    const filtered = filterTree(tree, (n) => n.status === 'draft');
    expect(filtered.map((i) => i.node.id)).toEqual(['teil']);
    expect(filtered[0]!.children.map((i) => i.node.id)).toEqual(['k1']);
    expect(filtered[0]!.wordCount).toBe(100);
    expect(countScenes(filtered)).toBe(1);
    expect(countScenes(tree)).toBe(3);
    expect(filterTree(tree, () => false)).toEqual([]);
  });
});
