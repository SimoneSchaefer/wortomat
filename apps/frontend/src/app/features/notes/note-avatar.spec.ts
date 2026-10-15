import { testNote } from '../../testing/fake-api';
import { render, text } from '../../testing/render';
import { NoteAvatar } from './note-avatar';

describe('NoteAvatar', () => {
  it('shows the initials of the first and last word without a picture', async () => {
    const { element, fixture, settle } = await render(NoteAvatar, {
      inputs: { note: testNote('a', 'character', { title: 'anna maria berger' }) },
    });
    expect(text(element)).toBe('AB');
    fixture.componentRef.setInput('note', testNote('b', 'place', { title: 'Hafen' }));
    await settle();
    expect(text(element)).toBe('H');
  });

  it('shows the profile picture, cropped to fill the circle once its size is known', async () => {
    const note = testNote('a', 'character', {
      coverImageUrl: '/api/images/foto',
      coverCrop: { x: 0.5, y: 0, width: 0.5, height: 1 },
    });
    const { element, settle } = await render(NoteAvatar, { inputs: { note } });
    const image = element.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('/api/images/foto');
    expect(image.classList).not.toContain('cropped');

    Object.defineProperties(image, {
      naturalWidth: { value: 1600 },
      naturalHeight: { value: 900 },
    });
    image.dispatchEvent(new Event('load'));
    await settle();
    expect(image.classList).toContain('cropped');
  });
});
