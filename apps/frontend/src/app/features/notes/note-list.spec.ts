import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { FakeApi, testNote } from '../../testing/fake-api';
import { button, key, render, startDrag, text, until } from '../../testing/render';
import { NoteList } from './note-list';
import { NotesStore } from './notes-store';

@Component({ template: '' })
class Blank {}

const CHARACTERS = de.noteKinds.character;

function cast(groups = true): FakeApi {
  const api = new FakeApi();
  api.notes = [
    testNote('zora', 'character', { title: 'Zora', groupId: groups ? 'polizei' : null }),
    testNote('anna', 'character', { title: 'Anna', summary: 'Ärztin, 34' }),
    testNote('ben', 'character', { title: 'Ben', groupId: groups ? 'familie' : null }),
    testNote('hafen', 'place', { title: 'Hafen' }),
  ];
  if (groups) {
    api.noteGroups = [
      { id: 'familie', kind: 'character', name: 'Familie Berger' },
      { id: 'polizei', kind: 'character', name: 'Polizei' },
      { id: 'leer', kind: 'character', name: 'Nachbarn' },
      { id: 'orte', kind: 'place', name: 'Küste' },
    ];
  }
  return api;
}

async function setup(api = cast()) {
  const view = await render(NoteList, {
    api,
    inputs: { kind: 'character' },
    providers: [NotesStore],
    routes: [
      { path: 'write/characters', component: Blank },
      { path: 'write/characters/:id', component: Blank },
    ],
  });
  const store = TestBed.inject(NotesStore);
  await store.load();
  await view.settle();
  const confirm = TestBed.inject(ConfirmDialog);
  const section = (name: string) =>
    [...view.element.querySelectorAll<HTMLElement>('section.group')].find(
      (s) => text(s.querySelector('.group-name')) === name,
    )!;
  const titles = (root: ParentNode = view.element) =>
    [...root.querySelectorAll('.title')].map(text);
  const item = (title: string) =>
    [...view.element.querySelectorAll<HTMLElement>('li')].find(
      (li) => text(li.querySelector('.title')) === title,
    )!;
  return { ...view, store, confirm, section, titles, item };
}

describe('NoteList', () => {
  it('lists the notes of its kind alphabetically, with summary and initials', async () => {
    const { element, titles, item } = await setup(cast(false));
    expect(titles()).toEqual(['Anna', 'Ben', 'Zora']);
    expect(text(item('Anna').querySelector('.summary'))).toBe('Ärztin, 34');
    expect(text(item('Anna').querySelector('wm-note-avatar'))).toBe('A');
    expect(item('Anna').querySelector('a')!.getAttribute('href')).toBe('/write/characters/anna');
    expect(element.querySelector('section.group')).toBeNull();
  });

  it('shows groups in their order, empty ones too, and "No group" last', async () => {
    const { element, section, titles } = await setup();
    expect([...element.querySelectorAll('.group-name')].map(text)).toEqual([
      'Familie Berger',
      'Polizei',
      'Nachbarn',
      de.notes.ungrouped,
    ]);
    expect(titles(section('Familie Berger'))).toEqual(['Ben']);
    expect(titles(section(de.notes.ungrouped))).toEqual(['Anna']);
    expect(text(section('Nachbarn').querySelector('.empty'))).toBe(de.notes.emptyGroup);
    expect(text(section('Polizei').querySelector('.group-count'))).toBe('1');
  });

  it('collapses a group', async () => {
    const { section, settle, titles } = await setup();
    button(section('Polizei'), `${de.tree.collapse}: Polizei`).click();
    await settle();
    expect(titles(section('Polizei'))).toEqual([]);
    expect(button(section('Polizei'), `${de.tree.expand}: Polizei`)).toBeTruthy();
  });

  it('notes the empty list', async () => {
    const { element } = await setup(new FakeApi());
    expect(text(element.querySelector('.empty'))).toBe(CHARACTERS.emptyList);
  });

  it('creates a note and opens it', async () => {
    const { api, fixture, router, settle } = await setup();
    await fixture.componentInstance.add();
    await settle();
    expect(api.createNote).toHaveBeenCalledWith({ kind: 'character', title: CHARACTERS.newTitle });
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(router.url).toBe('/write/characters/notiz-1');
  });

  it('creates a note in a group via its "+" and expands the group for it', async () => {
    const { api, section, store, settle, titles } = await setup();
    store.toggleGroup('leer');
    await settle();
    button(section('Nachbarn'), CHARACTERS.addToGroup).click();
    await until(settle, () => titles(section('Nachbarn')).includes(CHARACTERS.newTitle));
    expect(api.updateNote).toHaveBeenCalledWith('notiz-1', { groupId: 'leer' });
  });

  it('creates a group and lets it be named right away', async () => {
    const { api, fixture, element, settle } = await setup();
    await fixture.componentInstance.addGroup();
    await settle();
    const input = element.querySelector<HTMLInputElement>('.group-head input')!;
    await until(settle, () => document.activeElement === input);
    input.value = 'Freunde';
    key(input, 'Enter');
    await settle();
    expect(api.createNoteGroup).toHaveBeenCalledWith({
      kind: 'character',
      name: de.notes.newGroup,
    });
    expect(api.updateNoteGroup).toHaveBeenCalledWith('gruppe-1', { name: 'Freunde' });
  });

  it('renames a group by double-click; Escape keeps the name', async () => {
    const { api, section, element, settle } = await setup();
    section('Polizei').querySelector('.group-name')!.dispatchEvent(new MouseEvent('dblclick'));
    await settle();
    const input = element.querySelector<HTMLInputElement>('.group-head input')!;
    input.value = 'Kripo';
    key(input, 'Escape');
    await settle();
    expect(api.updateNoteGroup).not.toHaveBeenCalled();
  });

  it('deletes a note only after confirmation and leaves its page', async () => {
    const { api, confirm, item, router, settle, titles } = await setup();
    await router.navigateByUrl('/write/characters/anna');
    button(item('Anna'), de.notes.deleteLabel('Anna')).click();
    await settle();
    expect(confirm.pending()).toMatchObject({
      title: de.notes.deleteTitle(CHARACTERS.singular),
      message: de.notes.deleteMessage('Anna'),
    });
    confirm.answer(true);
    await until(settle, () => router.url === '/write/characters');
    expect(api.deleteNote).toHaveBeenCalledWith('anna');
    expect(titles()).not.toContain('Anna');
  });

  it('deletes a group after confirmation; its notes stay without a group', async () => {
    const { api, confirm, section, settle, titles } = await setup();
    button(section('Polizei'), de.notes.deleteGroupLabel('Polizei')).click();
    await settle();
    expect(confirm.pending()?.message).toBe(CHARACTERS.deleteGroupMessage('Polizei'));
    confirm.answer(true);
    await until(settle, () => !section('Polizei'));
    expect(api.deleteNoteGroup).toHaveBeenCalledWith('polizei');
    expect(titles(section(de.notes.ungrouped))).toEqual(['Anna', 'Zora']);
  });

  it('moves a note into another group by dragging', async () => {
    const { api, item, section, settle } = await setup();
    const drag = startDrag();
    drag.fire(item('Anna'), 'dragstart');
    drag.fire(section('Familie Berger'), 'dragover');
    await settle();
    expect(section('Familie Berger').classList).toContain('drop-target');
    drag.fire(section('Familie Berger'), 'drop');
    await settle();
    expect(api.updateNote).toHaveBeenCalledWith('anna', { groupId: 'familie' });
  });

  it('does not save when a note is dropped onto its own group', async () => {
    const { api, item, section, settle } = await setup();
    const drag = startDrag();
    drag.fire(item('Ben'), 'dragstart');
    drag.fire(section('Familie Berger'), 'dragover');
    drag.fire(section('Familie Berger'), 'drop');
    await settle();
    expect(api.updateNote).not.toHaveBeenCalled();
  });

  it('reorders groups by dragging their header', async () => {
    const { api, section, settle } = await setup();
    const drag = startDrag();
    drag.fire(section('Nachbarn').querySelector('.group-head')!, 'dragstart');
    // jsdom has no layout: the pointer counts as the lower half, i.e. "after".
    drag.fire(section('Familie Berger'), 'dragover');
    await settle();
    expect(section('Familie Berger').getAttribute('data-drop')).toBe('after');
    drag.fire(section('Familie Berger'), 'drop');
    await settle();
    expect(api.moveNoteGroup).toHaveBeenCalledWith('leer', { beforeId: 'polizei' });
  });
});
