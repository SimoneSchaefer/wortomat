import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testNode, testProject } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { TrashPage } from './trash-page';

@Component({ template: '' })
class Blank {}

async function setup() {
  const api = new FakeApi();
  api.project = testProject();
  api.nodes = [
    testNode('teil', 'part', null, { title: 'Frieda' }),
    testNode('k1', 'chapter', 'teil', { title: 'Fokuszeit' }),
    testNode('a', 'scene', 'k1', { title: 'Ankunft' }),
    testNode('b', 'scene', 'k1', { title: 'Abschied' }),
  ];
  await api.deleteNode('b');
  api.trash[0]!.entry.path = ['Frieda', 'Fokuszeit'];
  api.trash[0]!.entry.wordCount = 1200;
  await api.deleteNode('teil');
  const view = await render(TrashPage, {
    api,
    before: () => TestBed.inject(ProjectStore).reload(),
    routes: [{ path: 'write/scene/:id', component: Blank }],
  });
  const confirm = TestBed.inject(ConfirmDialog);
  const item = (title: string) =>
    [...view.element.querySelectorAll<HTMLElement>('li')].find(
      (li) => text(li.querySelector('.title')) === title,
    )!;
  const titles = () => [...view.element.querySelectorAll('li .title')].map(text);
  return { ...view, confirm, item, titles, store: TestBed.inject(ProjectStore) };
}

describe('TrashPage', () => {
  it('lists deleted items newest first with kind, path and size', async () => {
    const { item, titles } = await setup();
    expect(titles()).toEqual(['Frieda', 'Abschied']);
    expect(text(item('Frieda').querySelector('.kind'))).toBe(de.trash.kind.part);
    expect(text(item('Frieda').querySelector('.path'))).toBe(de.trash.topLevel);
    expect(text(item('Frieda').querySelector('.details'))).toContain(de.trash.scenes(1));
    expect(text(item('Abschied').querySelector('.path'))).toBe('Frieda › Fokuszeit');
    expect(text(item('Abschied').querySelector('.details'))).toContain(de.words(1200));
    // Scenes do not count themselves
    expect(text(item('Abschied').querySelector('.details'))).not.toContain(de.trash.scenes(1));
  });

  it('restores a part into the tree and says so', async () => {
    const { api, element, item, titles, settle, store } = await setup();
    button(item('Frieda'), de.trash.restoreLabel('Frieda')).click();
    await until(settle, () => !titles().includes('Frieda'));
    expect(api.restoreFromTrash).toHaveBeenCalledWith('teil');
    expect(store.findNode('a')?.parentId).toBe('k1');
    expect(text(element.querySelector('[role=status]'))).toBe(de.trash.restored('Frieda'));
  });

  it('opens a restored scene', async () => {
    const { item, router, settle } = await setup();
    button(item('Abschied'), de.trash.restoreLabel('Abschied')).click();
    await until(settle, () => router.url === '/write/scene/b');
  });

  it('deletes for good only after confirmation', async () => {
    const { api, confirm, element, item, titles, settle } = await setup();
    button(item('Abschied'), de.trash.deleteForGoodLabel('Abschied')).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.trash.deleteForGoodMessage('Abschied'));
    confirm.answer(false);
    await settle();
    expect(api.deleteFromTrash).not.toHaveBeenCalled();

    button(item('Abschied'), de.trash.deleteForGoodLabel('Abschied')).click();
    await settle();
    confirm.answer(true);
    await until(settle, () => titles().length === 1);
    expect(api.deleteFromTrash).toHaveBeenCalledWith('b');

    button(element, de.trash.emptyTrash).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.trash.emptyTrashMessage(1));
    confirm.answer(true);
    await until(settle, () => titles().length === 0);
    expect(text(element.querySelector('.empty'))).toBe(de.trash.empty);
  });
});
