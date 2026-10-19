import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { FakeApi, testNode } from '../../testing/fake-api';
import {
  button,
  findButton,
  key,
  render,
  startDrag,
  text,
  type,
  until,
} from '../../testing/render';
import { filterScenes } from './arc-scene-picker';
import { NoteArc } from './note-arc';

async function setup(prepare: (api: FakeApi) => void = () => {}) {
  const api = new FakeApi();
  api.nodes = [
    testNode('k1', 'chapter', null, { title: 'Kapitel 1', sortOrder: 1 }),
    testNode('flucht', 'scene', 'k1', { title: 'Flucht', sortOrder: 1, status: 'draft' }),
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
      { id: 'a', noteId: 'mara', label: 'traut niemandem', details: '', sceneIds: ['flucht'] },
      {
        id: 'b',
        noteId: 'mara',
        label: 'lässt Lena helfen',
        details: 'widerwillig',
        sceneIds: [],
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
    // The scene's status as in the manuscript tree
    const chip = steps[0]!.querySelector<HTMLElement>('wm-arc-scene-picker .chip .open')!;
    expect(chip.querySelector('wm-status-icon')!.getAttribute('style')).toContain(
      'var(--status-draft)',
    );
    expect(chip.title).toBe(
      `${de.arc.openScene}: Kapitel 1 › Flucht · ${de.sceneStatus.names.draft}`,
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

  it('moves stations by dragging their number', async () => {
    const { element, api, settle, labels } = await setup(withSteps);
    const steps = () => [...element.querySelectorAll('.step')];
    const drag = startDrag();
    drag.fire(steps()[0]!.querySelector('.marker')!, 'dragstart');
    await settle();
    expect(steps()[0]!.classList).toContain('dragging');
    // jsdom has no layout: the pointer counts as in the lower half – after the station
    drag.fire(steps()[1]!, 'dragover');
    await settle();
    expect(steps()[1]!.getAttribute('data-drop')).toBe('after');
    drag.fire(steps()[1]!, 'drop');
    await until(settle, () => labels()[0] === 'lässt Lena helfen');
    expect(api.moveArcStep).toHaveBeenCalledWith('a', null);
    expect(element.querySelector('[data-drop], .dragging')).toBeNull();
  });

  it('does not save when a station is dropped onto its own place', async () => {
    const { element, api, settle } = await setup(withSteps);
    const first = element.querySelector('.step')!;
    const drag = startDrag();
    drag.fire(first.querySelector('.marker')!, 'dragstart');
    drag.fire(first, 'dragover');
    drag.fire(first, 'drop');
    await settle();
    expect(api.moveArcStep).not.toHaveBeenCalled();
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

  it('holds several scenes per station, in book order, and removes single ones', async () => {
    const { element, api, settle } = await setup(withSteps);
    const first = () => element.querySelectorAll('.step')[0]!;
    const chips = () => [...first().querySelectorAll('.chip .open')].map(text);
    // "Flucht" is there already; "Hilfe" comes after it in the book
    button(first(), de.arc.addScene).click();
    await settle();
    expect([...first().querySelectorAll('.picker li')].map(text)).toEqual(['HilfeKapitel 1']);
    key(first().querySelector<HTMLInputElement>('.picker input')!, 'Enter');
    await until(settle, () => chips().length === 2);
    expect(api.addArcStepScene).toHaveBeenCalledWith('a', 'hilfe');
    expect(chips()).toEqual(['Kapitel 1 › Flucht', 'Kapitel 1 › Hilfe']);

    button(first(), de.arc.removeScene).click();
    await until(settle, () => chips().length === 1);
    expect(api.removeArcStepScene).toHaveBeenCalledWith('a', 'flucht');
    expect(chips()).toEqual(['Kapitel 1 › Hilfe']);
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

describe('NoteArc order check', () => {
  function outOfOrder(api: FakeApi) {
    api.arcs.set('mara', {
      noteId: 'mara',
      summary: '',
      steps: [
        { id: 'a', noteId: 'mara', label: 'lässt Lena helfen', details: '', sceneIds: ['hilfe'] },
        { id: 'b', noteId: 'mara', label: 'ohne Szene', details: '', sceneIds: [] },
        { id: 'c', noteId: 'mara', label: 'traut niemandem', details: '', sceneIds: ['flucht'] },
      ],
    });
  }

  it('says nothing while the stations follow the story', async () => {
    const { element } = await setup(withSteps);
    expect(element.querySelector('.order-warning')).toBeNull();
    expect(element.querySelector('.misplaced')).toBeNull();
  });

  it('flags stations against the story and sorts them on request', async () => {
    const { element, api, settle, labels } = await setup(outOfOrder);
    expect(text(element.querySelector('.order-warning span:not(.warning-dot)'))).toBe(
      de.arc.outOfOrder(1),
    );
    const flagged = [...element.querySelectorAll('.step.misplaced')];
    expect(flagged).toHaveLength(1);
    // Two stations with swapped scenes: either one could be the odd one out
    expect(flagged[0]!.querySelector<HTMLTextAreaElement>('.step-label')!.value).toBe(
      'lässt Lena helfen',
    );
    expect(text(flagged[0]!.querySelector('.order-hint'))).toBe(de.arc.belongsAfter(3));
    // Also on the number, above the drag hint
    expect(flagged[0]!.querySelector<HTMLElement>('.marker')!.title).toBe(
      `${de.arc.belongsAfter(3)}\n${de.arc.dragHint}`,
    );
    expect(element.querySelector<HTMLElement>('.step:not(.misplaced) .marker')!.title).toBe(
      de.arc.dragHint,
    );

    button(element, de.arc.sortByStory).click();
    await until(settle, () => labels()[0] === 'traut niemandem');
    expect(api.reorderArcSteps).toHaveBeenCalledWith('mara', ['c', 'b', 'a']);
    expect(labels()).toEqual(['traut niemandem', 'ohne Szene', 'lässt Lena helfen']);
    expect(element.querySelector('.order-warning')).toBeNull();
  });

  it('marks a single scene out of place and offers no sorting that would not help', async () => {
    const { element, settle } = await setup((api) => {
      api.nodes.push(testNode('keller', 'scene', 'k1', { title: 'Keller', sortOrder: 3 }));
      api.arcs.set('mara', {
        noteId: 'mara',
        summary: '',
        steps: [
          { id: 'a', noteId: 'mara', label: 'zweifelt', details: '', sceneIds: ['hilfe'] },
          // Flucht happens before "zweifelt", Keller after it
          {
            id: 'b',
            noteId: 'mara',
            label: 'lässt sich helfen',
            details: '',
            sceneIds: ['keller', 'flucht'],
          },
        ],
      });
    });
    await settle();
    const flagged = [...element.querySelectorAll('.step.misplaced')];
    expect(
      flagged.map((li) => li.querySelector<HTMLTextAreaElement>('.step-label')!.value),
    ).toEqual(['lässt sich helfen']);
    const hint = de.arc.sceneBefore('Flucht', 1);
    expect(text(flagged[0]!.querySelector('.order-hint'))).toBe(hint);
    // In book order: Flucht, Keller
    const chips = [...flagged[0]!.querySelectorAll('.chip')];
    expect(chips.map((chip) => chip.classList.contains('misplaced'))).toEqual([true, false]);
    expect(chips[0]!.querySelector<HTMLElement>('.open')!.title.split('\n')[0]).toBe(hint);
    expect(findButton(element, de.arc.sortByStory)).toBeNull();
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
