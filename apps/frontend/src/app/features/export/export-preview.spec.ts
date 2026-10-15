import type { BookLayout, ExportPreview } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { TEST_EXPORT_SETTINGS } from '../../testing/fake-api';
import { render, text } from '../../testing/render';
import { ExportPreviewPages } from './export-preview';

const CONTENT: ExportPreview = {
  title: 'Die Häuser am Fluss',
  author: 'S. S.',
  chapterTitle: 'Ankunft',
  html: '<p>Es war einmal.</p>',
};

async function setup(
  template: 'normseite' | 'roman',
  content: ExportPreview | null = CONTENT,
  layout: BookLayout = TEST_EXPORT_SETTINGS.layout,
) {
  const view = await render(ExportPreviewPages, {
    inputs: { template, layout, fontFamily: 'Palatino, serif', content },
  });
  const pages = () => [...view.element.querySelectorAll<HTMLElement>('.page')];
  return { ...view, pages };
}

describe('ExportPreviewPages', () => {
  it('shows a title page and three text pages', async () => {
    const { pages } = await setup('roman');
    expect(pages()).toHaveLength(4);
    expect(text(pages()[0]!.querySelector('.book-title'))).toBe('Die Häuser am Fluss');
    expect(text(pages()[0]!.querySelector('.book-author'))).toBe('S. S.');
  });

  it('sets the novel in the chosen page size and font, with page numbers', async () => {
    const { pages } = await setup('roman');
    const page = pages()[1]!;
    expect([page.style.width, page.style.height]).toEqual(['125mm', '190mm']);
    expect(page.style.fontFamily).toBe('Palatino, serif');
    expect(page.style.fontSize).toBe('11pt');
    expect(text(page.querySelector('.page-number'))).toBe('1');
  });

  it('mirrors the margins: the gutter is left on right-hand pages and right on left-hand ones', async () => {
    const { pages } = await setup('roman');
    const left = (index: number) => pages()[index]!.querySelector<HTMLElement>('.text')!.style.left;
    expect([left(1), left(2)]).toEqual(['20mm', '15mm']);
  });

  it('shows the chapter opening and its text on the first text page', async () => {
    const { pages } = await setup('roman');
    expect(text(pages()[1]!.querySelector('.chapter-title'))).toBe('Ankunft');
    expect(text(pages()[1]!.querySelector('.content'))).toBe('Es war einmal.');
  });

  it('lays out the standard page as the norm demands, whatever the type area says', async () => {
    const { pages } = await setup('normseite');
    const page = pages()[1]!;
    expect([page.style.width, page.style.height]).toEqual(['210mm', '297mm']);
    expect(page.style.fontSize).toBe('12pt');
    expect(text(page.querySelector('.ns-header'))).toBe('S. S.: Die Häuser am Fluss1');
    const titlePage = pages()[0]!.querySelector('.ns-title')!;
    expect(text(titlePage.querySelector('strong'))).toBe('Die Häuser am Fluss');
    expect(text(titlePage.querySelector('div'))).toBe('von S. S.');
  });

  it('says so while the book has no text yet', async () => {
    const { pages } = await setup('roman', { ...CONTENT, chapterTitle: null, html: '' });
    expect(text(pages()[1]!.querySelector('.empty'))).toBe(de.export.previewEmpty);
  });
});
