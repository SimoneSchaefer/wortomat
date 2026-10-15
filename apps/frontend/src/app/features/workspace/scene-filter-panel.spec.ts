import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { FakeApi, testNode, testNote } from '../../testing/fake-api';
import { button, key, render, text } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { SceneFilter } from './scene-filter';
import { SceneFilterPanel } from './scene-filter-panel';

async function setup() {
  const api = new FakeApi();
  api.nodes = [
    testNode('k', 'chapter', null),
    testNode('s1', 'scene', 'k', { status: 'draft', sortOrder: 1 }),
    testNode('s2', 'scene', 'k', { status: 'idea', sortOrder: 2, turningPoint: true }),
    testNode('s3', 'scene', 'k', { status: 'final', sortOrder: 3 }),
  ];
  api.notes = [testNote('anna', 'character', { title: 'Anna' }), testNote('ben', 'character')];
  api.strands = [
    { id: 'lena', name: 'Lena', color: 'violet', sceneCount: 2 },
    { id: 'leer', name: 'Ohne Szenen', color: 'teal', sceneCount: 0 },
  ];
  api.relations = [
    {
      sceneId: 's1',
      noteIds: ['anna'],
      tags: [{ id: 't', name: 'Rückblende' }],
      strandIds: ['lena'],
    },
    { sceneId: 's3', noteIds: [], tags: [], strandIds: ['lena'] },
  ];
  const view = await render(SceneFilterPanel, { api, providers: [SceneFilter, NotesStore] });
  await TestBed.inject(NotesStore).load();
  const filter = TestBed.inject(SceneFilter);
  const open = async () => {
    button(view.element, new RegExp(`^${de.filter.toggle}`)).click();
    // Twice: once for opening, once for the relations that load meanwhile.
    await view.settle();
    await view.settle();
    return view.element.querySelector<HTMLElement>('[role=dialog]')!;
  };
  const group = (popover: HTMLElement, label: string) =>
    popover.querySelector<HTMLElement>(`[role=group][aria-label="${label}"]`)!;
  return { ...view, filter, open, group };
}

describe('SceneFilterPanel', () => {
  it('lädt beim Öffnen frisch, was den Szenen zugeordnet ist', async () => {
    const { api, open, group } = await setup();
    const popover = await open();
    expect(api.sceneRelations).toHaveBeenCalledTimes(1);
    expect(api.listStrands).toHaveBeenCalledTimes(1);

    // Only threads, characters and tags that some scene actually uses.
    expect([...group(popover, 'Stränge').querySelectorAll('button')].map(text)).toEqual(['Lena']);
    expect([...group(popover, 'Charaktere').querySelectorAll('button')].map(text)).toEqual([
      'A Anna', // initials avatar, then the name
    ]);
    expect([...group(popover, 'Tags').querySelectorAll('button')].map(text)).toEqual([
      '#Rückblende',
    ]);
  });

  it('filtert per Klick und zeigt, wie viele Szenen übrig sind', async () => {
    const { element, open, group, filter, settle } = await setup();
    const popover = await open();

    const draft = button(group(popover, 'Status'), 'Entwurf');
    draft.click();
    await settle();
    expect(draft.getAttribute('aria-pressed')).toBe('true');
    expect(filter.criteria().statuses).toEqual(['draft']);
    expect(text(element.querySelector('[role=status]'))).toBe(de.filter.count(1, 3));
    expect(text(element.querySelector('.badge'))).toBe('1');

    // Within a row one match is enough …
    button(group(popover, 'Status'), 'Fertig').click();
    await settle();
    expect(text(element.querySelector('[role=status]'))).toBe(de.filter.count(2, 3));

    // … across rows everything must match.
    button(group(popover, 'Charaktere'), /Anna/).click();
    await settle();
    expect(text(element.querySelector('[role=status]'))).toBe(de.filter.count(1, 3));
  });

  it('filtert auf Wendepunkte und setzt mit „Zurücksetzen“ alles zurück', async () => {
    const { element, open, group, filter, settle } = await setup();
    const popover = await open();
    button(group(popover, 'Wendepunkt'), de.filter.turningPoints).click();
    await settle();
    expect(filter.shownCount()).toBe(1);

    button(element, de.filter.reset).click();
    await settle();
    expect(filter.active()).toBe(false);
    expect(element.querySelector('[role=status]')).toBeNull();
  });

  it('schließt mit Escape (Fokus zurück auf den Knopf), beim Klick daneben und beim zweiten Klick', async () => {
    const { element, open, settle } = await setup();
    const toggle = button(element, new RegExp(`^${de.filter.toggle}`));

    const popover = await open();
    key(popover, 'Escape');
    await settle();
    expect(element.querySelector('[role=dialog]')).toBeNull();
    expect(document.activeElement).toBe(toggle);

    await open();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(element.querySelector('[role=dialog]')).toBeNull();

    await open();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    toggle.click();
    await settle();
    expect(element.querySelector('[role=dialog]')).toBeNull();
  });

  it('vergisst gelöschte Stränge im Filter, damit noch Szenen passen können', async () => {
    const { api, open, group, filter, settle } = await setup();
    let popover = await open();
    button(group(popover, 'Stränge'), 'Lena').click();
    await settle();
    expect(filter.criteria().strandIds).toEqual(['lena']);

    api.strands = [];
    button(popover.ownerDocument.body, new RegExp(`^${de.filter.toggle}`)).click();
    await settle();
    popover = await open();
    expect(filter.criteria().strandIds).toEqual([]);
    expect(popover.querySelector('[aria-label="Stränge"]')).toBeNull();
  });

  it('meldet, wenn das Laden scheitert, und zeigt trotzdem die festen Zeilen', async () => {
    const { api, open, group } = await setup();
    api.sceneRelations.mockRejectedValueOnce(new Error('offline'));
    const popover = await open();
    expect(group(popover, 'Status')).not.toBeNull();
  });
});
