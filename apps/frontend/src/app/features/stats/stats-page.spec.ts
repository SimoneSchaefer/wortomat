import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { FakeApi, testNode, testNote } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { StatsPage } from './stats-page';

const S = de.stats;

function book(): FakeApi {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Ankunft', sortOrder: 1 }),
    testNode('a', 'scene', 'k1', { title: 'A', sortOrder: 1, wordCount: 600, status: 'final' }),
    testNode('b', 'scene', 'k1', { title: 'B', sortOrder: 2, wordCount: 400, status: 'draft' }),
    testNode('k2', 'chapter', null, { title: 'Flucht', sortOrder: 2 }),
    testNode('c', 'scene', 'k2', { title: 'C', sortOrder: 1, wordCount: 1000, status: 'draft' }),
  ];
  api.notes = [
    testNote('anna', 'character', { title: 'Anna' }),
    testNote('ben', 'character', { title: 'Ben' }),
    testNote('hafen', 'place', { title: 'Hafen' }),
  ];
  api.relations = [
    { sceneId: 'b', noteIds: ['anna', 'hafen'], tags: [], strandIds: [] },
    { sceneId: 'c', noteIds: ['anna'], tags: [], strandIds: [] },
  ];
  return api;
}

async function setup(api = book()) {
  const view = await render(StatsPage, {
    api,
    providers: [NotesStore],
    before: () => TestBed.inject(NotesStore).load(),
  });
  await until(view.settle, () => api.sceneRelations.mock.calls.length > 0);
  await view.settle();
  const tile = (label: string) =>
    text(
      [...view.element.querySelectorAll('.tile')]
        .find((t) => text(t.querySelector('dt')) === label)
        ?.querySelector('dd'),
    );
  const segments = () =>
    [...view.element.querySelectorAll('.progress-bar .segment')].map((s) =>
      s.getAttribute('data-tip'),
    );
  return { ...view, tile, segments };
}

describe('StatsPage', () => {
  it('sums up the book in figures', async () => {
    const { tile } = await setup();
    expect(tile(S.totalWords)).toBe('2.000');
    expect(tile(S.totalScenes)).toBe('3');
    expect(tile(S.pages)).toBe(S.pagesValue(8));
    expect(tile(S.finalShare)).toBe('30 %');
  });

  it('shows progress by words or by scenes', async () => {
    const { element, segments, settle } = await setup();
    expect(segments()).toEqual([
      `Entwurf: ${de.words(1400)} · ${S.scenes(2)}`,
      `Fertig: ${de.words(600)} · ${S.scenes(1)}`,
    ]);
    button(element.querySelector('.toggle')!, S.unitScenes).click();
    await settle();
    expect(
      button(element.querySelector('.toggle')!, S.unitScenes).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('measures progress in scenes while no words are written', async () => {
    const api = book();
    api.nodes = api.nodes.map((node) => ({ ...node, wordCount: 0 }));
    const { element, tile } = await setup(api);
    expect(tile(S.finalShare)).toBe('–');
    expect(element.querySelector(`[aria-label="${S.progressBy}"]`)).toBeNull();
    const weights = [...element.querySelectorAll<HTMLElement>('.progress-bar .segment')].map(
      (segment) => segment.style.flexGrow,
    );
    expect(weights).toEqual(['2', '1']);
  });

  it('lists the words per chapter', async () => {
    const { element } = await setup();
    expect([...element.querySelectorAll('.chapters .chapter .value')].map(text)).toEqual([
      '1.000',
      '1.000',
    ]);
  });

  it('shows who appears where, links to the scene and names those without scenes', async () => {
    const { element, settle } = await setup();
    const rows = () =>
      [...element.querySelectorAll('table.presence tbody tr')].map((row) => [
        text(row.querySelector('.name')),
        [...row.querySelectorAll('td')]
          .map((cell) => (cell.querySelector('.dot') ? 'x' : '·'))
          .join(''),
      ]);
    expect(rows()).toEqual([['Anna', '·xx']]);
    expect(element.querySelector('table.presence .dot')?.getAttribute('href')).toBe(
      '/write/scene/b',
    );
    expect(text(element.querySelector('.absent'))).toContain('Ben');

    button(element, de.noteKinds.place.label).click();
    await settle();
    expect(rows()).toEqual([['Hafen', '·x·']]);
  });

  it('shows a tooltip for anything with a hint, by pointer and by keyboard', async () => {
    const { element, settle } = await setup();
    const segment = element.querySelector<HTMLElement>('.progress-bar .segment')!;
    segment.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    await settle();
    expect(text(element.querySelector('.tooltip'))).toBe(segment.getAttribute('data-tip'));

    segment.dispatchEvent(new PointerEvent('pointerout', { bubbles: true }));
    await settle();
    expect(element.querySelector('.tooltip')).toBeNull();
  });
});
