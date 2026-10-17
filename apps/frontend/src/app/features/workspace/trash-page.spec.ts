import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testNode, testNote, testProject } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { TrashPage } from './trash-page';

@Component({ template: '' })
class Blank {}

async function setup(trashArea?: string) {
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
  api.noteGroups = [{ id: 'familie', kind: 'character', name: 'Familie' }];
  api.notes = [
    testNote('frieda', 'character', { title: 'Frieda', groupId: 'familie' }),
    testNote('ben', 'character', { title: 'Ben' }),
    testNote('hafen', 'place', { title: 'Hafen' }),
  ];
  for (const id of ['frieda', 'ben', 'hafen']) await api.deleteNote(id);
  const view = await render(TrashPage, {
    api,
    inputs: trashArea ? { trashArea } : {},
    providers: [NotesStore],
    before: () => TestBed.inject(ProjectStore).reload(),
    routes: [
      { path: 'write/scene/:id', component: Blank },
      { path: 'write/characters/:id', component: Blank },
    ],
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
    expect(api.emptyTrash).toHaveBeenCalledWith('manuscript');
    expect(text(element.querySelector('.empty'))).toBe(de.trash.empty);
  });

  it('lists only the notes of its area, with their group', async () => {
    const { element, item, titles } = await setup('character');
    expect(titles()).toEqual(['Ben', 'Frieda']);
    expect(text(element.querySelector('.muted'))).toBe(de.trash.hint.character);
    expect(text(item('Frieda').querySelector('.kind'))).toBe(de.trash.kind.character);
    expect(text(item('Frieda').querySelector('.path'))).toBe('Familie');
    expect(text(item('Ben').querySelector('.path'))).toBe(de.trash.noGroup);
  });

  it('restores a note into its list and opens it', async () => {
    const { api, item, router, settle } = await setup('character');
    const notes = TestBed.inject(NotesStore);
    button(item('Frieda'), de.trash.restoreLabel('Frieda')).click();
    await until(settle, () => router.url === '/write/characters/frieda');
    expect(api.restoreFromTrash).toHaveBeenCalledWith('frieda');
    expect(notes.find('frieda')?.title).toBe('Frieda');
  });

  it('says so when a restored note lost its group', async () => {
    const { api, element, item, router, settle } = await setup('character');
    api.restoreFromTrash.mockImplementationOnce(async (id: string) => ({
      nodes: [],
      id,
      atOldPlace: false,
    }));
    button(item('Frieda'), de.trash.restoreLabel('Frieda')).click();
    await until(settle, () => text(element.querySelector('[role=status]')) !== '');
    expect(text(element.querySelector('[role=status]'))).toBe(
      de.trash.restoredWithoutGroup('Frieda'),
    );
    expect(router.url).toBe('/');
  });

  it('empties only its own area', async () => {
    const { api, confirm, element, item, settle, store, titles } = await setup('character');
    button(item('Ben'), de.trash.deleteForGoodLabel('Ben')).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.trash.deleteNoteForGoodMessage('Ben'));
    confirm.answer(false);
    await settle();

    button(element, de.trash.emptyTrash).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.trash.emptyTrashMessage(2));
    confirm.answer(true);
    await until(settle, () => titles().length === 0);
    expect(api.emptyTrash).toHaveBeenCalledWith('character');
    expect(store.trash().map((entry) => entry.title)).toEqual(['Hafen', 'Frieda', 'Abschied']);
  });
});
