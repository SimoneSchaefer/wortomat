import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { FakeApi, testMap, testNote } from '../../testing/fake-api';
import { render, text, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { MapsStore } from './maps-store';
import { NoteLocation } from './note-location';

async function setup(pinned: boolean) {
  const api = new FakeApi();
  api.notes = [testNote('hafen', 'place', { title: 'Hafen' }), testNote('turm', 'place')];
  api.maps.set(
    'kueste',
    testMap('kueste', {
      name: 'Küste',
      strokes: [{ tool: 'pen', color: '#3d3530', width: 4, points: [0, 0, 100, 100] }],
      pins: pinned
        ? [
            { noteId: 'hafen', x: 400, y: 300 },
            { noteId: 'turm', x: 800, y: 200 },
          ]
        : [],
    }),
  );
  const view = await render(NoteLocation, {
    api,
    inputs: { noteId: 'hafen' },
    providers: [NotesStore, MapsStore],
    before: () =>
      Promise.all([TestBed.inject(NotesStore).load(), TestBed.inject(MapsStore).load()]),
  });
  await until(view.settle, () => api.mapsWithPlace.mock.calls.length > 0);
  await view.settle();
  return view;
}

describe('NoteLocation', () => {
  it('previews the maps the place is on, highlighted, with a link to place it there', async () => {
    const { element } = await setup(true);
    const preview = element.querySelector('a.preview')!;
    expect(preview.getAttribute('href')).toBe('/write/places/maps/kueste?place=hafen');
    expect(text(preview.querySelector('.name'))).toBe('Küste');
    const svg = preview.querySelector('wm-map-preview svg')!;
    expect(svg.getAttribute('viewBox')).toBe('0 0 1600 1000');
    expect(svg.querySelectorAll('path.pen')).toHaveLength(1);
    // the other place as a dot, this one with its name
    expect(svg.querySelectorAll('circle.other')).toHaveLength(1);
    expect(text(svg.querySelector('text'))).toBe('Hafen');
  });

  it('offers the existing maps when the place is on none of them', async () => {
    const { element } = await setup(false);
    expect(text(element.querySelector('.none'))).toContain(de.maps.notOnMap);
    expect(element.querySelector('.none a')?.getAttribute('href')).toBe(
      '/write/places/maps/kueste?place=hafen',
    );
  });
});
