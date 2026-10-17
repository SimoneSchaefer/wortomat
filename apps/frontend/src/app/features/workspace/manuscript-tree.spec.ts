import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testNode } from '../../testing/fake-api';
import { button, findButton, key, render, startDrag, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { ManuscriptTree } from './manuscript-tree';
import { SceneFilter } from './scene-filter';

@Component({ template: '' })
class Blank {}

// Teil I › Kapitel 1 › A, B, C · Kapitel 2 (no part) › D
function book(): FakeApi {
  const api = new FakeApi();
  api.nodes = [
    testNode('teil', 'part', null, { title: 'Teil I', sortOrder: 1 }),
    testNode('k1', 'chapter', 'teil', { title: 'Kapitel 1', sortOrder: 1 }),
    testNode('a', 'scene', 'k1', { title: 'A', sortOrder: 1, wordCount: 1200, status: 'draft' }),
    testNode('b', 'scene', 'k1', { title: 'B', sortOrder: 2, wordCount: 300 }),
    testNode('c', 'scene', 'k1', { title: 'C', sortOrder: 3, wordCount: 5 }),
    testNode('k2', 'chapter', null, { title: 'Kapitel 2', sortOrder: 2 }),
    testNode('d', 'scene', 'k2', { title: 'D', sortOrder: 1, wordCount: 40 }),
  ];
  return api;
}

async function setup(api = book()) {
  const view = await render(ManuscriptTree, {
    api,
    providers: [SceneFilter, NotesStore],
    routes: [
      { path: 'write', component: Blank },
      { path: 'write/scene/:id', component: Blank },
    ],
  });
  const confirm = TestBed.inject(ConfirmDialog);
  const row = (title: string) =>
    [...view.element.querySelectorAll<HTMLElement>('.row')].find((r) =>
      text(r.querySelector('a, .label')).startsWith(title),
    )!;
  const titles = () => [...view.element.querySelectorAll('.row a, .row .label')].map(text);
  return { ...view, confirm, row, titles };
}

describe('ManuscriptTree', () => {
  it('shows parts, chapters and scenes in book order, word counts summed', async () => {
    const { row, titles } = await setup();
    expect(titles()).toEqual(['Teil I', 'Kapitel 1', 'A', 'B', 'C', 'Kapitel 2', 'D']);
    expect(text(row('Teil I').querySelector('.count'))).toBe('1.505');
    expect(text(row('A').querySelector('.count'))).toBe('1.200');
    expect(row('A').querySelector('a')!.getAttribute('href')).toBe('/write/scene/a');
    expect(row('A').querySelector('wm-status-icon')!.getAttribute('title')).toBe(
      de.tree.status('Entwurf'),
    );
  });

  it('collapses and expands chapters', async () => {
    const { row, titles, settle } = await setup();
    const collapse = button(row('Kapitel 1'), `${de.tree.collapse}: Kapitel 1`);
    expect(collapse.getAttribute('aria-expanded')).toBe('true');

    collapse.click();
    await settle();
    expect(titles()).toEqual(['Teil I', 'Kapitel 1', 'Kapitel 2', 'D']);

    button(row('Kapitel 1'), `${de.tree.expand}: Kapitel 1`).click();
    await settle();
    expect(titles()).toContain('B');
  });

  it('creates a scene via a chapter\'s "+" and opens it', async () => {
    const { api, row, router, settle } = await setup();
    const navigate = vi.spyOn(router, 'navigate');
    button(row('Kapitel 2'), de.tree.addScene).click();
    await settle();
    expect(api.createNode).toHaveBeenCalledWith({
      kind: 'scene',
      parentId: 'k2',
      title: de.tree.newTitle.scene,
    });
    expect(navigate).toHaveBeenCalledWith(['/write/scene', 'neu-1']);
  });

  it('creates a chapter and lets it be named right away; Enter saves', async () => {
    const { api, fixture, element, titles, settle } = await setup();
    await fixture.componentInstance.add('chapter', null);
    await settle();
    const input = element.querySelector<HTMLInputElement>('input')!;
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe(de.tree.newTitle.chapter);

    input.value = '  Kapitel 3 ';
    key(input, 'Enter');
    await settle();
    expect(api.updateNode).toHaveBeenCalledWith('neu-1', { title: 'Kapitel 3' });
    expect(titles()).toContain('Kapitel 3');
  });

  it('renames by double-click; Escape or an empty title change nothing', async () => {
    const { api, element, row, settle } = await setup();
    row('Kapitel 2').querySelector('.label')!.dispatchEvent(new MouseEvent('dblclick'));
    await settle();
    let input = element.querySelector<HTMLInputElement>('input')!;
    input.value = 'Anders';
    key(input, 'Escape');
    await settle();
    expect(element.querySelector('input')).toBeNull();

    row('Kapitel 2').querySelector('.label')!.dispatchEvent(new MouseEvent('dblclick'));
    await settle();
    input = element.querySelector<HTMLInputElement>('input')!;
    input.value = '   ';
    key(input, 'Enter');
    await settle();
    expect(api.updateNode).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation', async () => {
    const { api, confirm, row, titles, settle } = await setup();
    button(row('B'), de.common.delete).click();
    await settle();
    expect(confirm.pending()).toMatchObject({
      title: de.tree.deleteTitle.scene,
      message: de.tree.deleteScene('B'),
      confirmLabel: de.tree.moveToTrash,
      destructive: false,
    });
    confirm.answer(false);
    await settle();
    expect(api.deleteNode).not.toHaveBeenCalled();

    button(row('Kapitel 1'), de.common.delete).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.tree.deleteContainer('Kapitel 1'));
    confirm.answer(true);
    await until(settle, () => !titles().includes('Kapitel 1'));
    expect(api.deleteNode).toHaveBeenCalledWith('k1');
    expect(titles()).toEqual(['Teil I', 'Kapitel 2', 'D']);
    expect(
      TestBed.inject(ProjectStore)
        .trash()
        .map((entry) => entry.title),
    ).toEqual(['Kapitel 1']);
  });

  it('leaves a deleted scene that is currently open', async () => {
    const { confirm, row, router, settle } = await setup();
    await router.navigateByUrl('/write/scene/c');
    button(row('C'), de.common.delete).click();
    await settle();
    confirm.answer(true);
    await until(settle, () => router.url === '/write');
  });

  it('moves by dragging and marks where it lands', async () => {
    const { api, row, settle } = await setup();
    const drag = startDrag();
    drag.fire(row('C').parentElement!, 'dragstart');
    await settle();
    // jsdom has no layout: the pointer counts as the middle of the row, i.e. "after".
    drag.fire(row('A'), 'dragover');
    await settle();
    expect(row('A').parentElement!.getAttribute('data-drop')).toBe('after');

    drag.fire(row('A'), 'drop');
    await settle();
    expect(api.moveNode).toHaveBeenCalledWith('c', { parentId: 'k1', beforeId: 'b' });
    expect(row('A').parentElement!.hasAttribute('data-drop')).toBe(false);
  });

  it('does not ask the backend when a drop changes nothing or is not allowed', async () => {
    const { api, row, settle } = await setup();
    const sceneOntoItsPlace = startDrag();
    sceneOntoItsPlace.fire(row('B').parentElement!, 'dragstart');
    sceneOntoItsPlace.fire(row('A'), 'dragover');
    sceneOntoItsPlace.fire(row('A'), 'drop');
    await settle();

    const partIntoScene = startDrag();
    partIntoScene.fire(row('Teil I').parentElement!, 'dragstart');
    const over = partIntoScene.fire(row('D'), 'dragover');
    await settle();
    expect(over.defaultPrevented).toBe(false);
    partIntoScene.fire(row('D'), 'drop');
    await settle();

    expect(api.moveNode).not.toHaveBeenCalled();
  });

  it('ignores foreign things dragged into the tree (e.g. files)', async () => {
    const { row, settle } = await setup();
    const files = startDrag();
    const over = files.fire(row('A'), 'dragover');
    await settle();
    expect(over.defaultPrevented).toBe(false);
  });

  it('while filtering shows only matching scenes, everything expanded and not draggable', async () => {
    const { row, titles, settle, element } = await setup();
    button(row('Kapitel 1'), `${de.tree.collapse}: Kapitel 1`).click();
    TestBed.inject(SceneFilter).toggle('statuses', 'draft');
    await settle();
    expect(titles()).toEqual(['Teil I', 'Kapitel 1', 'A']);
    expect(findButton(element, /Einklappen|Ausklappen/)).toBeNull();
    expect(element.querySelector('li[draggable]')).toBeNull();

    TestBed.inject(SceneFilter).toggle('statuses', 'final');
    TestBed.inject(SceneFilter).toggle('statuses', 'draft');
    await settle();
    expect(text(element.querySelector('.empty'))).toBe(de.filter.noMatch);
  });

  it('invites to the first chapter while the book is empty', async () => {
    const { element } = await setup(new FakeApi());
    expect(text(element.querySelector('.empty'))).toBe(de.tree.empty);
  });
});
