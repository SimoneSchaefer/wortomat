import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { FakeApi, testNote } from '../../testing/fake-api';
import { button, key, render, text, type, until } from '../../testing/render';
import { NoteGroupPicker } from './note-group-picker';
import { NotesStore } from './notes-store';

async function setup(groupId: string | null = null) {
  const api = new FakeApi();
  api.notes = [
    testNote('anna', 'character', { title: 'Anna', groupId }),
    testNote('ben', 'character', { groupId: 'familie' }),
    testNote('zora', 'character', { groupId: 'familie' }),
  ];
  api.noteGroups = [
    { id: 'familie', kind: 'character', name: 'Familie Berger' },
    { id: 'polizei', kind: 'character', name: 'Polizei' },
    { id: 'kueste', kind: 'place', name: 'Küste' },
  ];
  const view = await render(NoteGroupPicker, {
    api,
    inputs: { noteId: 'anna', kind: 'character' },
    providers: [NotesStore],
  });
  await TestBed.inject(NotesStore).load();
  await view.settle();
  const input = () => view.element.querySelector<HTMLInputElement>('[role=combobox]');
  const options = () => [...view.element.querySelectorAll<HTMLElement>('[role=option]')];
  const openPicker = async () => {
    (
      view.element.querySelector<HTMLButtonElement>('.chip .open') ??
      button(view.element, de.notes.assignGroup)
    ).click();
    await until(view.settle, () => document.activeElement === input());
  };
  return { ...view, input, options, openPicker };
}

describe('NoteGroupPicker', () => {
  it('offers the groups of its kind with their size', async () => {
    const { openPicker, options } = await setup();
    await openPicker();
    expect(options().map(text)).toEqual(['Familie Berger2', 'Polizei0']);
  });

  it('assigns a group with arrow keys and Enter', async () => {
    const { api, element, input, openPicker, settle } = await setup();
    await openPicker();
    key(input()!, 'ArrowDown');
    key(input()!, 'Enter');
    await settle();
    expect(api.updateNote).toHaveBeenCalledWith('anna', { groupId: 'polizei' });
    expect(input()).toBeNull();
    expect(text(element.querySelector('.chip .open'))).toBe('Polizei');
  });

  it('filters while typing and offers to create a new group', async () => {
    const { api, input, openPicker, options, settle } = await setup();
    await openPicker();
    type(input()!, 'fam');
    await settle();
    expect(options().map(text)).toEqual(['Familie Berger2', `+ ${de.notes.createGroup('fam')}`]);

    type(input()!, 'Nachbarn');
    await settle();
    options()[0]!.click();
    await until(settle, () => api.updateNote.mock.calls.length > 0);
    expect(api.createNoteGroup).toHaveBeenCalledWith({ kind: 'character', name: 'Nachbarn' });
    expect(api.updateNote).toHaveBeenCalledWith('anna', { groupId: 'gruppe-1' });
  });

  it('does not offer to create a group that already exists', async () => {
    const { input, openPicker, options, settle } = await setup();
    await openPicker();
    type(input()!, 'polizei');
    await settle();
    expect(options().map(text)).toEqual(['Polizei0']);
  });

  it('shows the current group as a chip, offers only the others and can remove it', async () => {
    const { api, element, openPicker, options, settle } = await setup('familie');
    expect(text(element.querySelector('.chip .open'))).toBe('Familie Berger');

    await openPicker();
    expect(options().map(text)).toEqual(['Polizei0']);

    key(document.activeElement!, 'Escape');
    await settle();
    button(element, de.notes.removeFromGroup).click();
    await settle();
    expect(api.updateNote).toHaveBeenCalledWith('anna', { groupId: null });
    expect(element.querySelector('.chip')).toBeNull();
  });

  it('explains when there are no other groups yet', async () => {
    const { api, element, openPicker, settle } = await setup();
    api.noteGroups = [];
    await TestBed.inject(NotesStore).load();
    await settle();
    await openPicker();
    expect(text(element.querySelector('.hint'))).toBe(de.notes.noGroups);
  });

  it('closes on Escape and on a click elsewhere', async () => {
    const { input, openPicker, settle } = await setup();
    await openPicker();
    key(input()!, 'Escape');
    await settle();
    expect(input()).toBeNull();

    await openPicker();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(input()).toBeNull();
  });
});
