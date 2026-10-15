import { render, text } from '../../testing/render';
import { BookCover } from './book-cover';

describe('BookCover', () => {
  it('shows the cover image when there is one', async () => {
    const { element } = await render(BookCover, {
      inputs: { url: '/api/images/cover', title: 'Roman' },
    });
    expect(element.querySelector('img')?.getAttribute('src')).toBe('/api/images/cover');
    expect(element.querySelector('.title')).toBeNull();
  });

  it('designs a plain fallback from title and author', async () => {
    const { element } = await render(BookCover, {
      inputs: { title: 'Die Häuser am Fluss', author: 'S. S.' },
    });
    expect(text(element.querySelector('.title'))).toBe('Die Häuser am Fluss');
    expect(text(element.querySelector('.author'))).toBe('S. S.');
  });

  it('keeps the same colours for the same book', async () => {
    const { element, fixture, settle } = await render(BookCover, {
      inputs: { title: 'Roman', seed: '/home/test/Roman.wortomat' },
    });
    const colour = () => element.style.getPropertyValue('--cover-background');
    const first = colour();
    expect(first).not.toBe('');

    fixture.componentRef.setInput('seed', '/home/test/Novelle.wortomat');
    await settle();
    fixture.componentRef.setInput('seed', '/home/test/Roman.wortomat');
    await settle();
    expect(colour()).toBe(first);
  });
});
