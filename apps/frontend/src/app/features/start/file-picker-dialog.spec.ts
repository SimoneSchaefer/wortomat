import type { DirectoryListing } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { FakeApi } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { FilePickerDialog } from './file-picker-dialog';

const HOME: DirectoryListing = {
  path: '/home/test',
  parent: '/home',
  entries: [
    { name: 'Dokumente', path: '/home/test/Dokumente', kind: 'directory' },
    { name: 'Roman.wortomat', path: '/home/test/Roman.wortomat', kind: 'project' },
  ],
};
const DOCUMENTS: DirectoryListing = {
  path: '/home/test/Dokumente',
  parent: '/home/test',
  entries: [],
};
const ROOT: DirectoryListing = { path: '/', parent: null, entries: [] };

async function setup(mode: 'file' | 'folder' = 'file') {
  const api = new FakeApi();
  api.directories.set('/home/test', HOME);
  api.directories.set('/home/test/Dokumente', DOCUMENTS);
  api.directories.set('/home', ROOT);
  const view = await render(FilePickerDialog, { api, inputs: { mode } });
  const chosen: string[] = [];
  view.fixture.componentInstance.chosen.subscribe((path) => chosen.push(path));
  const dialog = view.element.querySelector('dialog')!;
  const open = async (dir = '/home/test') => {
    view.fixture.componentInstance.open(dir);
    await until(view.settle, () => text(dialog.querySelector('.path')) === dir);
  };
  const entry = (name: string) => button(dialog, new RegExp(name));
  return { ...view, dialog, chosen, open, entry };
}

describe('FilePickerDialog', () => {
  it('opens in the given folder and lists folders and books', async () => {
    const { api, dialog, open } = await setup();
    await open();
    expect(dialog.open).toBe(true);
    expect(api.listDirectory).toHaveBeenCalledWith('/home/test');
    expect([...dialog.querySelectorAll('.entries span')].map(text)).toEqual([
      'Dokumente',
      'Roman.wortomat',
    ]);
  });

  it('opens a folder on click and goes up again', async () => {
    const { dialog, entry, open, settle } = await setup();
    await open();
    entry('Dokumente').click();
    await until(settle, () => text(dialog.querySelector('.path')) === '/home/test/Dokumente');
    expect(text(dialog.querySelector('.empty'))).toBe(de.filePicker.empty);

    button(dialog, de.filePicker.up).click();
    await until(settle, () => text(dialog.querySelector('.path')) === '/home/test');
  });

  it('picks a book after selecting it, or right away by double-click', async () => {
    const { dialog, entry, open, chosen, settle } = await setup();
    await open();
    const openButton = button(dialog, de.filePicker.open);
    expect(openButton.disabled).toBe(true);

    entry('Roman').click();
    await settle();
    openButton.click();
    expect(chosen).toEqual(['/home/test/Roman.wortomat']);
    expect(dialog.open).toBe(false);

    await open();
    entry('Roman').dispatchEvent(new MouseEvent('dblclick'));
    expect(chosen).toHaveLength(2);
  });

  it('picks the folder shown in folder mode, books only for orientation', async () => {
    const { dialog, entry, open, chosen } = await setup('folder');
    await open();
    expect(entry('Roman').disabled).toBe(true);
    button(dialog, de.filePicker.chooseFolder).click();
    expect(chosen).toEqual(['/home/test']);
  });

  it('closes without a choice on cancel and on the backdrop', async () => {
    const { dialog, open, chosen } = await setup();
    await open();
    button(dialog, de.filePicker.cancel).click();
    expect(dialog.open).toBe(false);

    await open();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(dialog.open).toBe(false);
    expect(chosen).toEqual([]);
  });

  it('reports a folder that cannot be read', async () => {
    const { api, dialog, fixture, settle } = await setup();
    api.listDirectory.mockRejectedValueOnce(new Error('Keine Berechtigung'));
    fixture.componentInstance.open('/root');
    await until(settle, () => !!dialog.querySelector('[role=alert]'));
    expect(text(dialog.querySelector('[role=alert]'))).toBe('Keine Berechtigung');
  });
});
