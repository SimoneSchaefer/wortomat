import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testProject } from '../../testing/fake-api';
import { button, render, text, type, until, wait } from '../../testing/render';
import { BookDialog } from './book-dialog';

async function setup() {
  const api = new FakeApi();
  api.project = testProject({ title: 'Die Häuser am Fluss', author: 'S. S.' });
  const view = await render(BookDialog, {
    api,
    before: () => TestBed.inject(ProjectStore).reload(),
  });
  const dialog = view.element.querySelector('dialog')!;
  const [title, author] = [...dialog.querySelectorAll<HTMLInputElement>('input')];
  const open = async () => {
    view.fixture.componentInstance.open();
    await view.settle();
  };
  return { ...view, dialog, title: title!, author: author!, open };
}

describe('BookDialog', () => {
  it('opens with the book’s title and author', async () => {
    const { dialog, title, author, open } = await setup();
    await open();
    expect(dialog.open).toBe(true);
    expect([title.value, author.value]).toEqual(['Die Häuser am Fluss', 'S. S.']);
    expect(document.activeElement).toBe(dialog);
  });

  it('saves shortly after typing', async () => {
    const { api, title, open, settle } = await setup();
    await open();
    type(title, 'Die Häuser am See');
    await wait(700);
    await settle();
    expect(api.updateProject).toHaveBeenCalledWith({ title: 'Die Häuser am See' });
    expect(TestBed.inject(ProjectStore).project()?.title).toBe('Die Häuser am See');
  });

  it('saves pending changes when closed', async () => {
    const { api, author, dialog, open, settle } = await setup();
    await open();
    type(author, 'Simone');
    button(dialog, de.export.close).click();
    await until(settle, () => api.updateProject.mock.calls.length > 0);
    expect(api.updateProject).toHaveBeenCalledWith({ author: 'Simone' });
    expect(dialog.open).toBe(false);
  });

  it('never saves an empty title and puts the old one back', async () => {
    const { api, title, dialog, open, settle } = await setup();
    await open();
    type(title, '  ');
    title.dispatchEvent(new Event('blur'));
    await settle();
    expect(title.value).toBe('Die Häuser am Fluss');
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await settle();
    expect(api.updateProject).not.toHaveBeenCalled();
  });

  it('shows an error inside the dialog when saving fails', async () => {
    const { api, author, dialog, open, settle } = await setup();
    api.updateProject.mockRejectedValueOnce(new Error('Datei gesperrt'));
    await open();
    type(author, 'X');
    author.dispatchEvent(new Event('blur'));
    await until(settle, () => !!dialog.querySelector('[role=alert]'));
    expect(text(dialog.querySelector('[role=alert]'))).toBe('Datei gesperrt');
  });
});
