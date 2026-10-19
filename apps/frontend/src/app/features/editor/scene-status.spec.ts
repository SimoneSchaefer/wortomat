import { TestBed } from '@angular/core/testing';
import { ProjectStore } from '../../core/project-store';
import { StatusMessages } from '../../core/status-messages';
import { FakeApi, testNode } from '../../testing/fake-api';
import { button, key, render } from '../../testing/render';
import { SceneStatusPicker } from './scene-status';

async function setup(status: 'idea' | 'draft' = 'idea') {
  const api = new FakeApi();
  api.nodes = [testNode('k', 'chapter', null), testNode('s', 'scene', 'k', { status })];
  const view = await render(SceneStatusPicker, { api, inputs: { node: api.nodes[1] } });
  const store = TestBed.inject(ProjectStore);
  // As on the scene page: the input follows the store.
  const sync = async () => {
    await view.settle();
    view.fixture.componentRef.setInput('node', store.findNode('s'));
    await view.settle();
  };
  const checked = () =>
    view.element.querySelector('[role=radio][aria-checked=true]')?.textContent?.trim();
  return { ...view, sync, checked };
}

describe('SceneStatusPicker', () => {
  it('shows the current status as the selected button with a single tab stop', async () => {
    const { element, checked } = await setup('draft');
    expect(checked()).toBe('1. Entwurf');
    const tabbable = element.querySelectorAll('[role=radio][tabindex="0"]');
    expect([...tabbable].map((b) => b.textContent?.trim())).toEqual(['1. Entwurf']);
  });

  it('saves a clicked status', async () => {
    const { element, api, sync, checked } = await setup();
    button(element, '2. Entwurf').click();
    await sync();
    expect(api.updateNode).toHaveBeenCalledWith('s', { status: 'revised' });
    expect(checked()).toBe('2. Entwurf');
  });

  it('saves nothing when the status already applies', async () => {
    const { element, api } = await setup('draft');
    button(element, '1. Entwurf').click();
    expect(api.updateNode).not.toHaveBeenCalled();
  });

  it('switches with arrow keys, Home and End like a radio group', async () => {
    const { element, api, sync, checked } = await setup();
    const group = element.querySelector('[role=radiogroup]')!;

    key(group, 'ArrowRight');
    await sync();
    expect(checked()).toBe('Begonnen');
    expect(document.activeElement?.textContent?.trim()).toBe('Begonnen');

    key(group, 'End');
    await sync();
    expect(checked()).toBe('Fertig');

    key(group, 'Home');
    await sync();
    expect(checked()).toBe('Idee');
    expect(api.updateNode.mock.calls.map(([, request]) => request.status)).toEqual([
      'outline',
      'final',
      'idea',
    ]);
  });

  it('reports a save error in the status bar', async () => {
    const { element, api, settle } = await setup();
    api.updateNode.mockRejectedValueOnce(new Error('kaputt'));
    button(element, 'Fertig').click();
    await settle();
    expect(
      TestBed.inject(StatusMessages)
        .messages()
        .map((m) => m.text),
    ).toEqual(['kaputt']);
  });
});
