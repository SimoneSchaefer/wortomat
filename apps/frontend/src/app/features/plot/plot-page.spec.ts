import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppSettingsStore } from '../../core/app-settings';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { FakeApi, testNode } from '../../testing/fake-api';
import { button, key, render, text, until } from '../../testing/render';
import { PlotPage } from './plot-page';

@Component({ template: '' })
class Blank {}

const P = de.plot;

// Kapitel 1: A (Lena, draft), B (Tom) · Kapitel 2: C (Lena + Tom, turning point)
function book(): FakeApi {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Ankunft', sortOrder: 1 }),
    testNode('a', 'scene', 'k1', { title: 'A', sortOrder: 1, status: 'draft' }),
    testNode('b', 'scene', 'k1', { title: 'B', sortOrder: 2 }),
    testNode('k2', 'chapter', null, { title: 'Flucht', sortOrder: 2 }),
    testNode('c', 'scene', 'k2', { title: 'C', sortOrder: 1, turningPoint: true }),
  ];
  api.strands = [
    { id: 'lena', name: 'Lena', color: 'violet', sceneCount: 2 },
    { id: 'tom', name: 'Tom', color: 'teal', sceneCount: 2 },
  ];
  api.relations = [
    { sceneId: 'a', noteIds: [], tags: [], strandIds: ['lena'] },
    { sceneId: 'b', noteIds: [], tags: [], strandIds: ['tom'] },
    { sceneId: 'c', noteIds: [], tags: [], strandIds: ['lena', 'tom'] },
  ];
  return api;
}

async function setup(
  api = book(),
  view: Partial<{ order: 'story' | 'book'; onlyTurningPoints: boolean }> = {},
) {
  const rendered = await render(PlotPage, {
    api,
    routes: [{ path: 'write/scene/:id', component: Blank }],
    before: () =>
      TestBed.inject(AppSettingsStore).settings.update((settings) => ({
        ...settings,
        plotView: { order: 'story', onlyTurningPoints: false, compact: false, ...view },
      })),
  });
  await until(rendered.settle, () => api.storyMarks.mock.calls.length > 0);
  await rendered.settle();
  const node = (id: string) =>
    rendered.element.querySelector<SVGGElement>(`.node[data-scene="${id}"]`)!;
  const nodes = () =>
    [...rendered.element.querySelectorAll('.node')].map((n) => n.getAttribute('data-scene'));
  /** Centre of a node in drawing pixels (the drawing starts at x = 0 here). */
  const centre = (id: string) => {
    const shape = node(id).querySelector('rect, polygon')!;
    if (shape.tagName === 'rect') {
      return Number(shape.getAttribute('x')) + Number(shape.getAttribute('width')) / 2;
    }
    return Number(shape.getAttribute('points')!.split(' ')[0]!.split(',')[0]);
  };
  const pointer = (target: Element, type: string, clientX: number) =>
    target.dispatchEvent(
      new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, clientX, clientY: 0 }),
    );
  return { ...rendered, node, nodes, centre, pointer, confirm: TestBed.inject(ConfirmDialog) };
}

describe('PlotPage', () => {
  it('explains what is missing before there is anything to draw', async () => {
    const empty = await setup(new FakeApi());
    expect(text(empty.element.querySelector('.empty'))).toBe(P.noScenes);
  });

  it('asks for threads when the scenes have none', async () => {
    const api = book();
    api.strands = [];
    const { element } = await setup(api);
    expect(text(element.querySelector('.empty'))).toBe(P.noStrands);
  });

  it('draws one row per thread and every scene with its number in the book', async () => {
    const { element, nodes } = await setup();
    expect([...element.querySelectorAll('.lanes .name')].map(text)).toEqual(['Lena', 'Tom']);
    expect(nodes()).toEqual(['a', 'b', 'c']);
    expect([...element.querySelectorAll('.node .number')].map((number) => text(number))).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('shows only turning points when asked to, and remembers the choice', async () => {
    const { api, element, nodes, settle } = await setup();
    const toggle = button(element, new RegExp(`^${P.turningPoints}`));
    expect(text(toggle.querySelector('.count'))).toBe('1');
    toggle.click();
    await settle();
    expect(nodes()).toEqual(['c']);
    expect(api.updateSettings).toHaveBeenCalledWith({ plotView: { onlyTurningPoints: true } });
  });

  it('describes the scene under the pointer in the info line', async () => {
    const { element, node, settle } = await setup();
    node('c').dispatchEvent(new PointerEvent('pointerenter'));
    await settle();
    const info = text(element.querySelector('.info'));
    expect(info).toContain(P.chapter(2));
    expect(info).toContain('C');
    expect(info).toContain('Lena');
    expect(info).toContain('Tom');
    expect(info).toContain(de.sceneLinks.turningPoint);
    expect(info).toContain(P.bookPosition(3));

    node('c').dispatchEvent(new PointerEvent('pointerleave'));
    await settle();
    expect(text(element.querySelector('.info'))).toBe(P.hoverHint);
  });

  it('opens a scene by click or Enter', async () => {
    const { node, pointer, router, settle, centre } = await setup();
    pointer(node('b'), 'pointerdown', centre('b'));
    pointer(node('b'), 'pointerup', centre('b'));
    await until(settle, () => router.url === '/write/scene/b');

    key(node('a'), 'Enter');
    await until(settle, () => router.url === '/write/scene/a');
  });

  it('makes a dragged scene happen at the same time as the one it lands on', async () => {
    const { api, node, pointer, centre, settle } = await setup();
    pointer(node('a'), 'pointerdown', centre('a'));
    pointer(node('a'), 'pointermove', centre('c'));
    await settle();
    expect(node('a').classList).toContain('lifted');
    pointer(node('a'), 'pointerup', centre('c'));
    await until(settle, () => api.saveStory.mock.calls.length > 0);
    expect(api.saveStory).toHaveBeenCalledWith({ columns: [['b'], ['c', 'a']], marks: [] });
  });

  it('moves a scene one column later with Alt + arrow, and marks it as displaced', async () => {
    const { api, element, node, settle } = await setup();
    key(node('a'), 'ArrowRight', { altKey: true });
    await until(settle, () => api.saveStory.mock.calls.length > 0);
    expect(api.saveStory).toHaveBeenCalledWith({ columns: [['b'], ['a'], ['c']], marks: [] });
    await until(settle, () => !!element.querySelector('.node .displaced'));
  });

  it('starts a named section before a column', async () => {
    const { api, element, settle } = await setup();
    element.querySelectorAll<HTMLButtonElement>('.add-mark')[1]!.click();
    await settle();
    const input = element.querySelector<HTMLInputElement>('.mark-editor input')!;
    input.value = 'Tag 2';
    key(input, 'Enter');
    await until(settle, () => api.saveStory.mock.calls.length > 0);
    expect(api.saveStory.mock.calls[0]![0].marks).toEqual([{ label: 'Tag 2', beforeColumn: 1 }]);
    await until(settle, () => text(element.querySelector('.group.mark')) === 'Tag 2');
  });

  it('resets the story order only after confirmation', async () => {
    const api = book();
    api.nodes = api.nodes.map((n) => (n.id === 'c' ? { ...n, storyOrder: 1 } : n));
    const { element, confirm, settle } = await setup(api);
    button(element, P.reset).click();
    await settle();
    expect(confirm.pending()?.title).toBe(P.resetTitle);
    confirm.answer(true);
    await until(settle, () => api.saveStory.mock.calls.length > 0);
    expect(api.saveStory).toHaveBeenCalledWith({ columns: [], marks: [] });
  });

  it('reorders the threads with Alt + arrow on their row', async () => {
    const { api, element, settle } = await setup();
    key(element.querySelector('.lanes [data-strand="lena"]')!, 'ArrowDown', { altKey: true });
    await until(settle, () => api.moveStrand.mock.calls.length > 0);
    expect(api.moveStrand).toHaveBeenCalledWith('lena', null);
    await until(
      settle,
      () => [...element.querySelectorAll('.lanes .name')].map(text).join() === 'Tom,Lena',
    );
  });

  it('follows the book in book order: by chapter, nothing to move or reset', async () => {
    const api = book();
    api.nodes = api.nodes.map((n) => (n.id === 'c' ? { ...n, storyOrder: 1 } : n));
    const { element, node, settle } = await setup(api, { order: 'book' });
    expect([...element.querySelectorAll('.groups .group')].map(text)).toEqual([
      '1 Ankunft',
      '2 Flucht',
    ]);
    expect(element.querySelector('.add-mark')).toBeNull();
    expect(element.textContent).not.toContain(P.reset);
    key(node('a'), 'ArrowRight', { altKey: true });
    await settle();
    expect(api.saveStory).not.toHaveBeenCalled();
  });
});
