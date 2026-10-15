import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { FakeApi, testNote } from '../../testing/fake-api';
import { render, text, type, until, wait } from '../../testing/render';
import { MapsStore } from '../maps/maps-store';
import { NotePage } from './note-page';
import { NotesStore } from './notes-store';

const CHARACTERS = de.noteKinds.character;

async function setup(id = 'anna', kind: 'character' | 'research' = 'character') {
  const api = new FakeApi();
  api.notes = [
    testNote('anna', 'character', { title: 'Anna Berger', summary: 'Ärztin, 34' }),
    testNote('neu', 'character', { title: CHARACTERS.newTitle }),
    testNote('quelle', 'research', { title: 'Gezeiten' }),
  ];
  api.appearances.set('anna', [{ id: 's1', title: 'Ankunft', path: ['Kapitel 1'] }]);
  const view = await render(NotePage, {
    api,
    inputs: { id, kind },
    providers: [NotesStore, MapsStore],
    // As in the app: the workspace has loaded the notes before a note page shows.
    before: () => TestBed.inject(NotesStore).load(),
  });
  const store = TestBed.inject(NotesStore);
  await until(view.settle, () => !!view.element.querySelector('.ProseMirror'));
  const title = () => view.element.querySelector<HTMLTextAreaElement>('.doc-title')!;
  const summary = () => view.element.querySelector<HTMLTextAreaElement>('.doc-summary')!;
  const flush = () => TestBed.inject(PendingSaves).flushAll();
  return { ...view, store, title, summary, flush };
}

describe('NotePage', () => {
  it('shows kind, title and summary with gallery and appearances for characters', async () => {
    const { element, title, summary } = await setup();
    expect(text(element.querySelector('.doc-kind'))).toBe(CHARACTERS.singular);
    expect(title().value).toBe('Anna Berger');
    expect(summary().value).toBe('Ärztin, 34');
    expect(element.querySelector('wm-image-gallery')).not.toBeNull();
    await until(
      () => Promise.resolve(),
      () => text(element.querySelector('wm-note-appearances')).includes('Ankunft'),
    );
  });

  it('shows research notes with a gallery but without appearances', async () => {
    const { element } = await setup('quelle', 'research');
    expect(element.querySelector('wm-image-gallery')).not.toBeNull();
    expect(element.querySelector('wm-note-appearances')).toBeNull();
  });

  it('saves title and summary shortly after typing, in one request', async () => {
    const { api, title, summary, settle, store } = await setup();
    type(title(), 'Anna Brandt');
    type(summary(), 'Chirurgin');
    await wait(700);
    await settle();
    expect(api.updateNote.mock.calls).toEqual([
      ['anna', { title: 'Anna Brandt', summary: 'Chirurgin' }],
    ]);
    expect(store.find('anna')?.title).toBe('Anna Brandt');
  });

  it('turns pasted line breaks in the title into spaces', async () => {
    const { api, title, flush } = await setup();
    type(title(), 'Anna\nBerger');
    expect(title().value).toBe('Anna Berger');
    await flush();
    expect(api.updateNote).toHaveBeenCalledWith('anna', { title: 'Anna Berger' });
  });

  it('never saves an empty title and restores it on leaving the field', async () => {
    const { api, title, flush, settle } = await setup();
    type(title(), '   ');
    await settle();
    title().dispatchEvent(new Event('blur'));
    await settle();
    await flush();
    expect(api.updateNote).not.toHaveBeenCalled();
    expect(title().value).toBe('Anna Berger');
  });

  it('saves pending changes before another note is shown', async () => {
    const { api, fixture, title, settle } = await setup();
    type(title(), 'Anna B.');
    fixture.componentRef.setInput('id', 'neu');
    await until(settle, () => api.updateNote.mock.calls.length > 0);
    expect(api.updateNote).toHaveBeenCalledWith('anna', { title: 'Anna B.' });
    expect(title().value).toBe(CHARACTERS.newTitle);
  });

  it('selects the default title of a fresh note for overwriting', async () => {
    const { title, settle } = await setup('neu');
    await until(settle, () => document.activeElement === title());
    expect([title().selectionStart, title().selectionEnd]).toEqual([0, CHARACTERS.newTitle.length]);
  });

  it('starts a fresh character with the outline and saves its text', async () => {
    const { api, element, flush } = await setup('neu');
    const headings = [...element.querySelectorAll('.ProseMirror h2')].map(text);
    expect(headings).toEqual(CHARACTERS.outline);
    expect(api.noteContent).toHaveBeenCalledWith('neu');
    await flush();
    expect(api.saveNoteContent).not.toHaveBeenCalled();
  });

  it('says so when the note no longer exists', async () => {
    const api = new FakeApi();
    const view = await render(NotePage, {
      api,
      inputs: { id: 'weg', kind: 'character' },
      providers: [NotesStore, MapsStore],
    });
    expect(text(view.element.querySelector('.not-found'))).toBe(de.notes.notFound);
  });
});
