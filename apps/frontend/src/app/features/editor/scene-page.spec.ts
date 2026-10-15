import { TestBed } from '@angular/core/testing';
import type { EditorDoc } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testNode } from '../../testing/fake-api';
import { button, key, render, text, type, until, wait } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from '../workspace/scene-filter';
import { ScenePage } from './scene-page';

// "Es war einmal." with "einmal" marked as todo
const DOC = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Es war ' },
        {
          type: 'text',
          text: 'einmal',
          marks: [{ type: 'annotation', attrs: { kind: 'todo', note: null, suggestion: null } }],
        },
        { type: 'text', text: '.' },
      ],
    },
  ],
} as EditorDoc;

async function setup(id = 's1') {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Kapitel 1' }),
    testNode('s1', 'scene', 'k1', { title: 'Ankunft', wordCount: 3 }),
    testNode('neu', 'scene', 'k1', { title: de.tree.newTitle.scene, sortOrder: 2 }),
  ];
  api.sceneDocs.set('s1', DOC);
  api.writing = [{ day: api.today, added: 321, removed: 0, pasted: 0 }];
  const view = await render(ScenePage, {
    api,
    inputs: { id },
    providers: [NotesStore, SceneFilter],
    before: () => TestBed.inject(ProjectStore).toggleCollapsed('k1'),
  });
  const store = TestBed.inject(ProjectStore);
  await until(view.settle, () => !!view.element.querySelector('.ProseMirror'));
  await view.settle();
  const title = () => view.element.querySelector<HTMLInputElement>('input.doc-title')!;
  return { ...view, store, title, flush: () => TestBed.inject(PendingSaves).flushAll() };
}

describe('ScenePage', () => {
  it('shows title, status, links and text of the scene', async () => {
    const { element, title } = await setup();
    expect(title().value).toBe('Ankunft');
    expect(element.querySelector('wm-scene-status')).not.toBeNull();
    expect(element.querySelector('wm-scene-links')).not.toBeNull();
    expect(text(element.querySelector('.ProseMirror'))).toBe('Es war einmal.');
  });

  it('expands the tree down to the scene, e.g. when opened from the search', async () => {
    const { store } = await setup();
    expect(store.collapsed().has('k1')).toBe(false);
  });

  it('shows what was written today', async () => {
    const { element, settle } = await setup();
    await until(settle, () => text(element.querySelector('.today')) !== '');
    expect(text(element.querySelector('.today'))).toBe(de.editor.writtenToday(321));
  });

  it('renames the scene shortly after typing, trimmed', async () => {
    const { api, title, settle, store } = await setup();
    type(title(), '  Die Ankunft ');
    await wait(700);
    await settle();
    expect(api.updateNode).toHaveBeenCalledWith('s1', { title: 'Die Ankunft' });
    expect(store.findNode('s1')?.title).toBe('Die Ankunft');
  });

  it('never saves an empty title and restores it on leaving the field', async () => {
    const { api, title, settle, flush } = await setup();
    type(title(), '');
    await settle();
    key(title(), 'Enter');
    title().dispatchEvent(new Event('blur'));
    await settle();
    await flush();
    expect(api.updateNode).not.toHaveBeenCalled();
    expect(title().value).toBe('Ankunft');
  });

  it('saves a pending title before another scene is shown', async () => {
    const { api, fixture, title, settle } = await setup();
    type(title(), 'Abfahrt');
    fixture.componentRef.setInput('id', 'neu');
    await until(settle, () => api.updateNode.mock.calls.length > 0);
    expect(api.updateNode).toHaveBeenCalledWith('s1', { title: 'Abfahrt' });
    await until(settle, () => title().value === de.tree.newTitle.scene);
  });

  it('selects the default title of a fresh scene for overwriting', async () => {
    const { title, settle } = await setup('neu');
    await until(settle, () => document.activeElement === title());
    expect([title().selectionStart, title().selectionEnd]).toEqual([
      0,
      de.tree.newTitle.scene.length,
    ]);
  });

  it('saves the text and updates the counts in the tree', async () => {
    const { api, element, settle, store, flush } = await setup();
    element.querySelector<HTMLButtonElement>('.mark-item')!.click();
    await settle();
    button(element.querySelector('.mark-note')!, de.editor.proofDone).click();
    await settle();
    await flush();
    expect(api.saveSceneContent).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ text: 'Es war einmal.' }),
    );
    expect(store.findNode('s1')?.annotations).toEqual({ todo: 0, idea: 0, fixme: 1 });
  });
});
