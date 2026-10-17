import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { FakeApi, testNode } from '../../testing/fake-api';
import { button, key, render, text, type, until } from '../../testing/render';
import { filterScenes } from './arc-scene-picker';
import { NoteArc } from './note-arc';

async function setup(prepare: (api: FakeApi) => void = () => {}) {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Kapitel 1', sortOrder: 1 }),
    testNode('flucht', 'scene', 'k1', { title: 'Flucht', sortOrder: 1 }),
    testNode('hilfe', 'scene', 'k1', { title: 'Hilfe', sortOrder: 2 }),
  ];
  prepare(api);
  const view = await render(NoteArc, { api, inputs: { noteId: 'mara' } });
  await until(view.settle, () => !!view.element.querySelector('.arc'));
  const labels = () =>
    [...view.element.querySelectorAll<HTMLTextAreaElement>('.step-label')].map((f) => f.value);
  const flush = () => TestBed.inject(PendingSaves).flushAll();
  return { ...view, labels, flush };
}

function withSteps(api: FakeApi) {
  api.arcs.set('mara', {
    noteId: 'mara',
    summary: 'Von der Einzelgängerin zur Teamplayerin',
    steps: [
      { id: 'a', noteId: 'mara', label: 'traut niemandem', details: '', sceneId: 'flucht' },
      {
        id: 'b',
        noteId: 'mara',
        label: 'lässt Lena helfen',
        details: 'widerwillig',
        sceneId: null,
      },
    ],
  });
}

describe('NoteArc', () => {
  it('starts collapsed while the arc is empty', async () => {
    const { element } = await setup();
    const toggle = element.querySelector<HTMLButtonElement>('.toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('.summary')).toBeNull();
  });

  it('shows the arc and its stations with their scenes', async () => {
    const { element, labels } = await setup(withSteps);
    expect(text(element.querySelector('.count'))).toBe('2 Stationen');
    expect(element.querySelector<HTMLTextAreaElement>('.summary')!.value).toBe(
      'Von der Einzelgängerin zur Teamplayerin',
    );
    expect(labels()).toEqual(['traut niemandem', 'lässt Lena helfen']);
    const steps = element.querySelectorAll('.step');
    expect(text(steps[0]!.querySelector('wm-arc-scene-picker .chip .open'))).toBe(
      'Kapitel 1 › Flucht',
    );
    expect(steps[1]!.querySelector<HTMLTextAreaElement>('.step-details')!.value).toBe(
      'widerwillig',
    );
  });

  it('adds stations, saves typed text and creates the next one on Enter', async () => {
    const { element, api, settle, labels, flush } = await setup();
    element.querySelector<HTMLButtonElement>('.toggle')!.click();
    await settle();
    button(element, de.arc.addStep).click();
    await until(settle, () => labels().length === 1);
    const first = element.querySelector<HTMLTextAreaElement>('.step-label')!;
    expect(document.activeElement).toBe(first);

    type(first, 'traut niemandem');
    key(first, 'Enter');
    await until(settle, () => labels().length === 2);
    expect(api.updateArcStep).toHaveBeenCalledWith(api.arcs.get('mara')!.steps[0]!.id, {
      label: 'traut niemandem',
    });
    expect(labels()).toEqual(['traut niemandem', '']);

    type(element.querySelector<HTMLTextAreaElement>('.summary')!, 'Öffnet sich');
    await flush();
    expect(api.arcs.get('mara')!.summary).toBe('Öffnet sich');
  });

  it('moves stations with Alt+arrows', async () => {
    const { element, api, settle, labels } = await setup(withSteps);
    const second = element.querySelectorAll<HTMLTextAreaElement>('.step-label')[1]!;
    key(second, 'ArrowUp', { altKey: true });
    await until(settle, () => labels()[0] === 'lässt Lena helfen');
    expect(api.moveArcStep).toHaveBeenCalledWith('b', 'a');

    key(element.querySelector<HTMLTextAreaElement>('.step-label')!, 'ArrowDown', {
      altKey: true,
    });
    await until(settle, () => labels()[0] === 'traut niemandem');
    expect(api.moveArcStep).toHaveBeenLastCalledWith('b', null);
  });

  it('picks a scene and reports that the character is now linked', async () => {
    const { element, api, fixture, settle } = await setup(withSteps);
    let linked = 0;
    fixture.componentInstance.sceneLinked.subscribe(() => linked++);
    const second = element.querySelectorAll('.step')[1]!;
    button(second, de.arc.addScene).click();
    await settle();
    const search = second.querySelector<HTMLInputElement>('.picker input')!;
    type(search, 'hil');
    await settle();
    expect([...second.querySelectorAll('.picker li')].map(text)).toEqual(['HilfeKapitel 1']);
    key(search, 'Enter');
    await until(settle, () => linked === 1);
    await settle();
    expect(api.links.get('hilfe')).toEqual(['mara']);
    expect(text(second.querySelector('.chip .open'))).toBe('Kapitel 1 › Hilfe');
  });

  it('asks before deleting a station with content', async () => {
    const { element, api, settle, labels } = await setup(withSteps);
    const confirm = TestBed.inject(ConfirmDialog);
    button(element.querySelector('.step')!, de.arc.remove).click();
    await settle();
    expect(confirm.pending()?.message).toBe(de.arc.removeMessage('traut niemandem'));
    confirm.answer(true);
    await until(settle, () => labels().length === 1);
    expect(api.deleteArcStep).toHaveBeenCalledWith('a');
  });
});

describe('filterScenes', () => {
  const scenes = [
    { id: '1', title: 'Flucht', path: ['Teil I', 'Kapitel 1'] },
    { id: '2', title: 'Ärger', path: ['Kapitel 2'] },
  ];

  it('matches title and chapter, ignoring accents', () => {
    expect(filterScenes(scenes, 'arger').map((s) => s.id)).toEqual(['2']);
    expect(filterScenes(scenes, 'kapitel 1').map((s) => s.id)).toEqual(['1']);
    expect(filterScenes(scenes, ' ')).toEqual(scenes);
  });
});
