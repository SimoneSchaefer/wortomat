import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { FakeApi, testNode, testNote } from '../../testing/fake-api';
import { button, key, render, text, type, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from '../workspace/scene-filter';
import { SceneLinks } from './scene-links';

@Component({ template: '' })
class Blank {}

const L = de.sceneLinks;
const CHARACTERS = de.noteKinds.character;

async function setup() {
  const api = new FakeApi();
  api.nodes = [testNode('k', 'chapter', null), testNode('s1', 'scene', 'k')];
  api.notes = [
    testNote('anna', 'character', { title: 'Anna', summary: 'Ärztin' }),
    testNote('ben', 'character', { title: 'Ben' }),
    testNote('hafen', 'place', { title: 'Hafen' }),
  ];
  api.strands = [
    { id: 'lena', name: 'Lena', color: 'violet', sceneCount: 3 },
    { id: 'tom', name: 'Tom', color: 'teal', sceneCount: 1 },
  ];
  api.links.set('s1', ['anna']);
  api.sceneStrandsById.set('s1', ['lena']);
  api.sceneTagsById.set('s1', [{ id: 'rb', name: 'Rückblende' }]);
  api.sceneTagsById.set('s2', [{ id: 'sp', name: 'Spannung' }]);

  const view = await render(SceneLinks, {
    api,
    inputs: { sceneId: 's1' },
    providers: [NotesStore, SceneFilter],
    routes: [{ path: 'write/characters/:id', component: Blank }],
  });
  await TestBed.inject(NotesStore).load();
  await until(view.settle, () => view.element.querySelectorAll('.chip').length === 3);

  const row = (label: string) =>
    [...view.element.querySelectorAll<HTMLElement>('.group')].find(
      (group) => text(group.querySelector('.label')) === label,
    )!;
  const chips = (label: string) =>
    [...row(label).querySelectorAll('.chip .open')].map((chip) => text(chip).replace(/^#/, '# '));
  const input = () => view.element.querySelector<HTMLInputElement>('[role=combobox]');
  const options = () => [...view.element.querySelectorAll<HTMLElement>('[role=option]')];
  const openPicker = async (label: string, singular: string) => {
    button(row(label), L.add(singular)).click();
    await until(view.settle, () => document.activeElement === input());
  };
  return {
    ...view,
    filter: TestBed.inject(SceneFilter),
    confirm: TestBed.inject(ConfirmDialog),
    row,
    chips,
    input,
    options,
    openPicker,
  };
}

describe('SceneLinks', () => {
  it('shows what belongs to the scene, row by row', async () => {
    const { chips, row } = await setup();
    expect(chips(L.strands)).toEqual(['Lena']);
    expect(chips(CHARACTERS.label)).toEqual(['A Anna']);
    expect(row(de.noteKinds.place.label).querySelector('.chip')).toBeNull();
    expect(chips(L.tags)).toEqual(['# Rückblende']);
  });

  it('links a character from the picker and tells the scene filter', async () => {
    const { api, chips, filter, options, openPicker, settle } = await setup();
    await openPicker(CHARACTERS.label, CHARACTERS.singular);
    expect(options().map((o) => text(o.querySelector('.option-text')))).toEqual(['Ben']);

    options()[0]!.click();
    await until(settle, () => chips(CHARACTERS.label).length === 2);
    expect(api.linkNote).toHaveBeenCalledWith('s1', 'ben');
    expect([...(filter.links().get('s1')?.noteIds ?? [])]).toEqual(['anna', 'ben']);
  });

  it('creates a new character from the input and links it', async () => {
    const { api, input, options, openPicker, settle, chips } = await setup();
    await openPicker(CHARACTERS.label, CHARACTERS.singular);
    type(input()!, 'Carla');
    await settle();
    expect(text(options().at(-1))).toBe(`+ ${CHARACTERS.create('Carla')}`);
    key(input()!, 'Enter');
    await until(settle, () => chips(CHARACTERS.label).length === 2);
    expect(api.createNote).toHaveBeenCalledWith({ kind: 'character', title: 'Carla' });
  });

  it('adds a tag typed with a leading "#" without the "#"', async () => {
    const { api, input, openPicker, settle, chips } = await setup();
    await openPicker(L.tags, L.tag);
    await until(settle, () => api.listTags.mock.calls.length > 0);
    type(input()!, '#Spannung');
    await settle();
    key(input()!, 'Enter');
    await until(settle, () => chips(L.tags).length === 2);
    expect(api.addSceneTag).toHaveBeenCalledWith('s1', 'Spannung');
  });

  it('assigns a thread and offers only the others', async () => {
    const { api, options, openPicker, settle, chips } = await setup();
    await openPicker(L.strands, L.strand);
    await until(settle, () => options().length > 0);
    expect(options().map((o) => text(o.querySelector('.option-text')))).toEqual(['Tom']);
    expect(text(options()[0]!.querySelector('.count'))).toBe(L.sceneCount(1));
    options()[0]!.click();
    await until(settle, () => chips(L.strands).length === 2);
    expect(api.addSceneStrand).toHaveBeenCalledWith('s1', 'tom');
  });

  it('removes an entry from the scene', async () => {
    const { api, element, settle, chips } = await setup();
    button(element, L.removeLabel('Rückblende')).click();
    await until(settle, () => chips(L.tags).length === 0);
    expect(api.removeSceneTag).toHaveBeenCalledWith('s1', 'rb');

    button(element, L.removeLabel('Anna')).click();
    await until(settle, () => chips(CHARACTERS.label).length === 0);
    expect(api.unlinkNote).toHaveBeenCalledWith('s1', 'anna');
  });

  it("opens a linked character's page", async () => {
    const { row, router, settle } = await setup();
    row(CHARACTERS.label).querySelector<HTMLButtonElement>('.chip .open')!.click();
    await until(settle, () => router.url === '/write/characters/anna');
  });

  it('marks the scene as a turning point', async () => {
    const { api, element, settle } = await setup();
    const toggle = button(element, new RegExp(L.turningPoint));
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    await until(settle, () => toggle.getAttribute('aria-pressed') === 'true');
    expect(api.updateNode).toHaveBeenCalledWith('s1', { turningPoint: true });
  });

  it('closes the picker on Escape and on a click elsewhere', async () => {
    const { input, openPicker, settle } = await setup();
    await openPicker(L.tags, L.tag);
    key(input()!, 'Escape');
    await settle();
    expect(input()).toBeNull();

    await openPicker(L.tags, L.tag);
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(input()).toBeNull();
  });

  describe('thread editor', () => {
    async function openEditor() {
      const view = await setup();
      button(view.element, L.editStrandLabel('Lena')).click();
      await view.settle();
      const editor = view.element.querySelector<HTMLElement>('.strand-editor')!;
      return { ...view, editor };
    }

    it('renames and recolours the thread', async () => {
      const { api, editor, element, settle, chips } = await openEditor();
      const name = editor.querySelector('input')!;
      name.value = 'Lenas Weg';
      name.dispatchEvent(new Event('change'));
      await until(settle, () => chips(L.strands)[0] === 'Lenas Weg');
      expect(api.updateStrand).toHaveBeenCalledWith('lena', { name: 'Lenas Weg' });

      button(editor, L.strandColors.coral).click();
      const coral = () => button(element, L.strandColors.coral);
      await until(settle, () => coral().getAttribute('aria-checked') === 'true');
      expect(api.updateStrand).toHaveBeenLastCalledWith('lena', { color: 'coral' });
    });

    it('deletes the thread only after confirmation', async () => {
      const { api, editor, confirm, settle, chips, element } = await openEditor();
      button(editor, L.deleteStrand).click();
      await settle();
      expect(confirm.pending()?.message).toBe(L.deleteStrandMessage('Lena', 3));
      confirm.answer(true);
      await until(settle, () => chips(L.strands).length === 0);
      expect(api.deleteStrand).toHaveBeenCalledWith('lena');
      expect(element.querySelector('.strand-editor')).toBeNull();
    });

    it('closes with Escape', async () => {
      const { editor, element, settle } = await openEditor();
      key(editor, 'Escape');
      await settle();
      expect(element.querySelector('.strand-editor')).toBeNull();
    });
  });
});
