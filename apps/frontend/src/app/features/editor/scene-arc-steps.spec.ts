import { TestBed } from '@angular/core/testing';
import { FakeApi, testNote } from '../../testing/fake-api';
import { render, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { SceneArcSteps } from './scene-arc-steps';

async function setup(withSteps: boolean) {
  const api = new FakeApi();
  api.notes = [testNote('mara', 'character', { title: 'Mara' })];
  if (withSteps) {
    api.arcs.set('mara', {
      noteId: 'mara',
      summary: '',
      steps: [
        {
          id: 'a',
          noteId: 'mara',
          label: 'lässt Lena helfen',
          details: 'widerwillig',
          sceneIds: ['s1'],
        },
      ],
    });
  }
  const view = await render(SceneArcSteps, {
    api,
    inputs: { sceneId: 's1' },
    providers: [NotesStore],
    before: () => TestBed.inject(NotesStore).load(),
  });
  await until(view.settle, () => api.sceneArcSteps.mock.calls.length > 0);
  await view.settle();
  return view;
}

describe('SceneArcSteps', () => {
  it('shows the stations of the scene and leads to the character', async () => {
    const { element, router, settle } = await setup(true);
    const entry = element.querySelector<HTMLButtonElement>('li button')!;
    expect(text(entry)).toBe('M Mara: lässt Lena helfen');
    expect(entry.title).toBe('widerwillig');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    entry.click();
    await settle();
    expect(navigate).toHaveBeenCalledWith(['/write', 'characters', 'mara']);
  });

  it('stays hidden without stations', async () => {
    const { element } = await setup(false);
    expect(element.style.display).toBe('none');
  });
});
