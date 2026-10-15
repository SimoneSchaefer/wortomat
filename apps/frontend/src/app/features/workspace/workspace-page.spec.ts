import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testNode, testNote, testProject } from '../../testing/fake-api';
import { button, findButton, key, render, text, until } from '../../testing/render';
import { WorkspacePage } from './workspace-page';

@Component({ template: '' })
class Blank {}

const W = de.workspace;

async function setup(prepare: (api: FakeApi) => void = () => undefined) {
  const api = new FakeApi();
  api.project = testProject({ title: 'Die Häuser am Fluss' });
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Kapitel 1' }),
    testNode('s1', 'scene', 'k1', { title: 'Ankunft', wordCount: 1200 }),
  ];
  api.notes = [testNote('anna', 'character', { title: 'Anna' })];
  prepare(api);
  const view = await render(WorkspacePage, {
    api,
    before: () => TestBed.inject(ProjectStore).reload(),
    routes: ['', 'write', 'write/plot', 'write/stats', 'write/scene/:id', 'export', 'settings']
      .concat(['write/characters', 'write/characters/:id', 'write/places', 'write/research'])
      .concat(['proofreading'])
      .map((path) => ({ path, component: Blank })),
  });
  await view.router.navigateByUrl('/write');
  await until(view.settle, () => api.proofInbox.mock.calls.length > 0);
  await view.settle();
  const rail = (label: string) => button(view.element.querySelector('.rail')!, label);
  const sidebar = () => view.element.querySelector<HTMLElement>('aside.sidebar');
  const menu = () => view.element.querySelector<HTMLElement>('#top-actions-menu');
  const go = async (label: string, url: string) => {
    rail(label).click();
    await until(view.settle, () => view.router.url === url);
  };
  return { ...view, rail, sidebar, menu, go };
}

describe('WorkspacePage', () => {
  it('shows the book in the top bar and the manuscript with its word count', async () => {
    const { element, rail, sidebar } = await setup();
    expect(text(element.querySelector('.book-title'))).toBe('Die Häuser am Fluss');
    expect(rail(W.manuscript).getAttribute('aria-current')).toBe('page');
    expect(text(sidebar()?.querySelector('h2'))).toBe(`${W.manuscript} ${de.words(1200)}`);
    expect(sidebar()?.querySelector('wm-manuscript-tree')).not.toBeNull();
    expect(sidebar()?.querySelector('wm-scene-filter-panel')).not.toBeNull();
  });

  it('switches areas and continues where it left off in each', async () => {
    const { router, go, sidebar, settle } = await setup();
    await router.navigateByUrl('/write/scene/s1');
    await settle();

    await go(de.noteKinds.character.label, '/write/characters');
    expect(sidebar()?.querySelector('wm-note-list')).not.toBeNull();
    await router.navigateByUrl('/write/characters/anna');
    await settle();

    await go(W.manuscript, '/write/scene/s1');
    await go(de.noteKinds.character.label, '/write/characters/anna');
  });

  it('gives plot and statistics the full width', async () => {
    const { go, sidebar } = await setup();
    await go(de.plot.title, '/write/plot');
    expect(sidebar()).toBeNull();
    await go(de.stats.title, '/write/stats');
    expect(sidebar()).toBeNull();
  });

  it('adds chapters, parts, notes and groups from the sidebar header', async () => {
    const { api, sidebar, go, settle } = await setup();
    button(sidebar()!, de.tree.addChapterButton).click();
    button(sidebar()!, de.tree.addPartButton).click();
    await until(settle, () => api.createNode.mock.calls.length === 2);
    expect(api.createNode.mock.calls.map(([request]) => request.kind)).toEqual(['chapter', 'part']);

    await go(de.noteKinds.character.label, '/write/characters');
    button(sidebar()!, de.noteKinds.character.addLabel).click();
    button(sidebar()!, de.notes.addGroupButton).click();
    await until(settle, () => api.createNoteGroup.mock.calls.length === 1);
    expect(api.createNote).toHaveBeenCalledWith({
      kind: 'character',
      title: de.noteKinds.character.newTitle,
    });
  });

  it('opens and closes the menu – with Escape the focus goes back to its button', async () => {
    const { element, menu, settle } = await setup();
    const toggle = button(element, W.moreActions);
    toggle.click();
    await settle();
    expect(menu()).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    key(menu()!, 'Escape');
    await settle();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(toggle);

    toggle.click();
    await settle();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(menu()).toBeNull();
  });

  it('leads from the menu to export, settings and proofreading', async () => {
    const { element, menu, router, settle } = await setup();
    for (const [label, url] of [
      [W.export, '/export'],
      [de.common.settings, '/settings'],
      [W.proofreading, '/proofreading'],
    ] as const) {
      button(element, W.moreActions).click();
      await settle();
      button(menu()!, new RegExp(label)).click();
      await until(settle, () => router.url === url);
      expect(menu()).toBeNull();
    }
  });

  it('hints at new notes from the phone on the menu button and in the menu', async () => {
    const { element, menu, settle } = await setup((api) => {
      api.inboxState = { ...api.inboxState, newNotes: 2 };
    });
    expect(element.querySelector('.menu-toggle .inbox-dot')).not.toBeNull();
    button(element, W.moreActions).click();
    await settle();
    expect(text(menu()!.querySelector('.inbox-badge'))).toBe('2');
  });

  it('checks for new notes whenever the window comes back to the front', async () => {
    const { api, settle } = await setup();
    const calls = api.proofInbox.mock.calls.length;
    window.dispatchEvent(new Event('focus'));
    await settle();
    expect(api.proofInbox.mock.calls.length).toBe(calls + 1);
  });

  it('saves everything, then closes the project and goes to the start page', async () => {
    const order: string[] = [];
    const { api, element, menu, router, settle } = await setup();
    TestBed.inject(PendingSaves).register(async () => void order.push('flush'));
    api.closeProject.mockImplementationOnce(async () => void order.push('close'));
    button(element, W.moreActions).click();
    await settle();
    button(menu()!, new RegExp(W.closeProject)).click();
    await until(settle, () => router.url === '/');
    expect(order).toEqual(['flush', 'close']);
  });

  it('opens the book dialog from the cover in the top bar', async () => {
    const { element, settle } = await setup();
    button(element, W.changeCover).click();
    await settle();
    expect(element.querySelector<HTMLDialogElement>('wm-book-dialog dialog')!.open).toBe(true);
    expect(findButton(element, de.export.close)).not.toBeNull();
  });
});
