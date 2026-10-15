import { de } from '../../core/i18n/de';
import { FakeApi } from '../../testing/fake-api';
import { render, text, until } from '../../testing/render';
import { NoteAppearances } from './note-appearances';

async function setup(scenes: boolean) {
  const api = new FakeApi();
  if (scenes) {
    api.appearances.set('anna', [
      { id: 's1', title: 'Ankunft', path: ['Teil I', 'Kapitel 1'] },
      { id: 's2', title: 'Abschied', path: [] },
    ]);
  }
  const view = await render(NoteAppearances, { api, inputs: { noteId: 'anna' } });
  await until(view.settle, () => api.noteScenes.mock.calls.length > 0);
  await view.settle();
  return view;
}

describe('NoteAppearances', () => {
  it('lists the scenes in manuscript order with their chapter', async () => {
    const { element } = await setup(true);
    const links = [...element.querySelectorAll('a')];
    expect(links.map(text)).toEqual(['Kapitel 1 › Ankunft', 'Abschied']);
    expect(links[0]!.getAttribute('href')).toBe('/write/scene/s1');
    expect(links[0]!.getAttribute('title')).toBe('Teil I › Kapitel 1');
  });

  it('explains how to link scenes while there are none', async () => {
    const { element } = await setup(false);
    expect(text(element.querySelector('.none'))).toBe(de.notes.appearsNowhere);
  });
});
