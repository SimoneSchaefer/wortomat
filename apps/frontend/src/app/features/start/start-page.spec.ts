import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ProjectListEntry } from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { de } from '../../core/i18n/de';
import { StatusMessages } from '../../core/status-messages';
import { FakeApi, fakeDesktop } from '../../testing/fake-api';
import { button, key, render, text, type, until } from '../../testing/render';
import { StartPage } from './start-page';

@Component({ template: '' })
class Blank {}

const S = de.start;

function book(title: string, overrides: Partial<ProjectListEntry> = {}): ProjectListEntry {
  return {
    filePath: `/home/test/${title}.wortomat`,
    title,
    author: 'S. S.',
    available: true,
    isOpen: false,
    wordCount: 1234,
    coverImageId: null,
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    lastOpenedAt: new Date().toISOString(),
    ...overrides,
  };
}

async function setup(
  projects = [book('Roman'), book('Novelle'), book('Weg', { available: false })],
  desktop: ReturnType<typeof fakeDesktop> | null = null,
) {
  const api = new FakeApi();
  api.projects = projects;
  api.directories.set('/home/test/Dokumente', {
    path: '/home/test/Dokumente',
    parent: '/home/test',
    entries: [{ name: 'Krimis', path: '/home/test/Dokumente/Krimis', kind: 'directory' }],
  });
  api.directories.set('/home/test/Dokumente/Krimis', {
    path: '/home/test/Dokumente/Krimis',
    parent: '/home/test/Dokumente',
    entries: [],
  });
  const view = await render(StartPage, {
    api,
    providers: [{ provide: DESKTOP_BRIDGE, useValue: desktop }],
    routes: [
      { path: 'write', component: Blank },
      { path: 'settings', component: Blank },
    ],
  });
  await until(view.settle, () => !text(view.element).includes(de.common.loading));
  const details = () => view.element.querySelector<HTMLElement>('.details');
  const currentTitle = () => text(details()?.querySelector('.book-title'));
  const form = () => view.element.querySelector<HTMLFormElement>('#new-book-form');
  const submit = async (element: HTMLFormElement) => {
    element.dispatchEvent(new Event('submit', { cancelable: true }));
    await view.settle();
  };
  return { ...view, details, currentTitle, form, submit };
}

describe('StartPage', () => {
  it('shows the most recent book in the middle with its details', async () => {
    const { details, currentTitle } = await setup();
    expect(currentTitle()).toBe('Roman');
    expect(text(details()?.querySelector('.book-author'))).toBe('S. S.');
    expect(text(details()?.querySelector('.book-meta'))).toBe(
      `${de.words(1234)} · ${S.edited('vorgestern')}`,
    );
    expect(text(details()?.querySelector('.book-path'))).toBe('/home/test/Roman.wortomat');
  });

  it('pages through the books with arrows, keys and a click on a neighbour', async () => {
    const { element, currentTitle, settle } = await setup();
    const carousel = element.querySelector('.carousel')!;
    expect(button(element, S.previous).disabled).toBe(true);

    button(element, S.next).click();
    await settle();
    expect(currentTitle()).toBe('Novelle');

    key(carousel, 'End');
    await settle();
    expect(currentTitle()).toBe('Weg');
    expect(button(element, S.next).disabled).toBe(true);

    key(carousel, 'Home');
    await settle();
    element.querySelectorAll<HTMLButtonElement>('.slide')[1]!.click();
    await settle();
    expect(currentTitle()).toBe('Novelle');
  });

  it('opens the book in the middle and switches to writing', async () => {
    const { api, element, router, settle } = await setup();
    button(element, `${S.openBook}: Roman`).click();
    await until(settle, () => router.url === '/write');
    expect(api.openProject).toHaveBeenCalledWith('/home/test/Roman.wortomat');
  });

  it('marks a missing file and does not try to open it', async () => {
    const { element, details, settle, api } = await setup();
    key(element.querySelector('.carousel')!, 'End');
    await settle();
    expect(text(details()?.querySelector('.book-meta'))).toBe(S.missing);
    expect(button(details()!, S.openBook).disabled).toBe(true);
    expect(api.openProject).not.toHaveBeenCalled();
  });

  it('removes a book from the list without deleting the file', async () => {
    const { api, element, currentTitle, settle } = await setup();
    button(element, S.forgetLabel('Roman')).click();
    await until(settle, () => currentTitle() === 'Novelle');
    expect(api.forgetProject).toHaveBeenCalledWith('/home/test/Roman.wortomat');
  });

  it('reports a book that cannot be opened and reloads the list', async () => {
    const { api, element, settle } = await setup();
    api.openProject.mockRejectedValueOnce(new Error('Datei beschädigt'));
    button(element, `${S.openBook}: Roman`).click();
    await until(settle, () => api.listProjects.mock.calls.length === 2);
    expect(TestBed.inject(StatusMessages).messages()[0]?.text).toBe('Datei beschädigt');
  });

  describe('new book (browser mode)', () => {
    it('opens the form right away while there are no books', async () => {
      const { element, form } = await setup([]);
      expect(text(element.querySelector('.empty'))).toBe(S.empty);
      expect(form()).not.toBeNull();
    });

    it('suggests a file name from the title in the default folder', async () => {
      const { api, form, submit, settle, router } = await setup([]);
      const [title, path] = [...form()!.querySelectorAll('input')];
      expect(path!.value).toBe('/home/test/Dokumente/Neues Buch.wortomat');

      type(title!, 'Die Häuser am Fluss');
      await settle();
      expect(path!.value).toBe('/home/test/Dokumente/Die Häuser am Fluss.wortomat');

      await submit(form()!);
      await until(settle, () => router.url === '/write');
      expect(api.createProject).toHaveBeenCalledWith({
        filePath: '/home/test/Dokumente/Die Häuser am Fluss.wortomat',
        title: 'Die Häuser am Fluss',
      });
    });

    it('asks for a title before creating', async () => {
      const { api, form, submit } = await setup([]);
      await submit(form()!);
      expect(api.createProject).not.toHaveBeenCalled();
      expect(TestBed.inject(StatusMessages).messages()[0]?.text).toBe(S.titleRequired);
    });

    it('picks another folder via "Browse …"', async () => {
      const { form, settle, element } = await setup([]);
      button(form()!, S.browse).click();
      const picker = element.querySelector('wm-file-picker-dialog dialog') as HTMLDialogElement;
      await until(settle, () => !!picker.querySelector('.entries button'));
      button(picker, /Krimis/).click();
      await until(settle, () => text(picker.querySelector('.path')).endsWith('Krimis'));
      button(picker, de.filePicker.chooseFolder).click();
      await settle();
      expect(form()!.querySelectorAll('input')[1]!.value).toBe(
        '/home/test/Dokumente/Krimis/Neues Buch.wortomat',
      );
    });

    it('opens another file by its path', async () => {
      const { api, element, settle, router } = await setup([]);
      const openForm = [...element.querySelectorAll('form')].at(-1)!;
      const submitButton = button(openForm, S.open);
      expect(submitButton.disabled).toBe(true);
      type(openForm.querySelector('input')!, '/home/test/Alt.wortomat');
      await settle();
      openForm.dispatchEvent(new Event('submit', { cancelable: true }));
      await until(settle, () => router.url === '/write');
      expect(api.openProject).toHaveBeenCalledWith('/home/test/Alt.wortomat');
    });
  });

  describe('desktop', () => {
    it('creates via the native save dialog – and nothing when it is cancelled', async () => {
      const desktop = fakeDesktop();
      const { api, element, form, submit, settle, router } = await setup([], desktop);
      expect(element.querySelector('input[name=newPath]')).toBeNull();
      type(form()!.querySelector('input')!, 'Roman');
      await settle();

      desktop.showCreateProjectDialog.mockResolvedValueOnce(null);
      await submit(form()!);
      expect(api.createProject).not.toHaveBeenCalled();

      await submit(form()!);
      await until(settle, () => router.url === '/write');
      expect(desktop.showCreateProjectDialog).toHaveBeenLastCalledWith('Roman');
      expect(api.createProject).toHaveBeenCalledWith({
        filePath: '/home/test/Roman.wortomat',
        title: 'Roman',
      });
    });

    it('opens another file via the native open dialog', async () => {
      const desktop = fakeDesktop();
      const { api, element, settle, router } = await setup(undefined, desktop);
      button(element, S.openOtherFile).click();
      await until(settle, () => router.url === '/write');
      expect(api.openProject).toHaveBeenCalledWith('/home/test/Anderes.wortomat');
    });
  });
});
