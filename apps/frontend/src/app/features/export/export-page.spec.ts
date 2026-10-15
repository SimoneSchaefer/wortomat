import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import type { ExportCapabilities, ExportSettingsResponse } from '@wortomat/shared';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, fakeDesktop, TEST_EXPORT_SETTINGS, testProject } from '../../testing/fake-api';
import { button, render, text, until, wait } from '../../testing/render';
import { ExportPage } from './export-page';

const E = de.export;
// A little longer than the page's save delay.
const SAVE_DELAY = 600;

async function setup(prepare: (api: FakeApi) => void = () => undefined, desktop = false) {
  const api = new FakeApi();
  api.project = testProject({ title: 'Roman' });
  prepare(api);
  const bridge = desktop ? fakeDesktop() : null;
  const view = await render(ExportPage, {
    api,
    providers: [{ provide: DESKTOP_BRIDGE, useValue: bridge }],
    before: () => TestBed.inject(ProjectStore).reload(),
  });
  await until(view.settle, () => api.exportPreview.mock.calls.length > 0);
  await view.settle();
  const radio = (name: string, value: string) =>
    view.element.querySelector<HTMLInputElement>(`input[name=${name}][value="${value}"]`)!;
  const choose = async (name: string, value: string) => {
    radio(name, value).click();
    await view.settle();
  };
  const submit = async () => {
    view.element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await view.settle();
  };
  const legends = () => [...view.element.querySelectorAll('legend')].map(text);
  return { ...view, bridge, radio, choose, submit, legends };
}

describe('ExportPage', () => {
  it('starts with the settings remembered for this book', async () => {
    const { radio, legends } = await setup((api) => {
      api.exportState.settings = { ...TEST_EXPORT_SETTINGS, format: 'docx', template: 'roman' };
    });
    expect(radio('format', 'docx').checked).toBe(true);
    expect(radio('template', 'roman').checked).toBe(true);
    expect(legends()).toContain(E.format);
  });

  it('offers PDF only with pdfLaTeX – a remembered PDF becomes Word', async () => {
    const { element, radio } = await setup((api) => {
      api.capabilities = { ...api.capabilities, pdf: { available: false, version: null } };
      api.exportState.settings = { ...TEST_EXPORT_SETTINGS, format: 'pdf' };
    });
    expect(radio('format', 'pdf').disabled).toBe(true);
    expect(radio('format', 'docx').checked).toBe(true);
    expect(text(radio('format', 'pdf').closest('label'))).toContain(E.pdfMissing);
    expect(element.querySelector('wm-export-preview')).not.toBeNull();
  });

  it('keeps a format chosen while pdfLaTeX is still being searched for', async () => {
    let finishSearch!: (capabilities: ExportCapabilities) => void;
    const api = new FakeApi();
    api.project = testProject({ title: 'Roman' });
    api.exportState.settings = { ...TEST_EXPORT_SETTINGS, format: 'docx' };
    const capabilities = { ...api.capabilities, pdf: { available: false, version: null } };
    api.exportCapabilities.mockReturnValueOnce(new Promise((resolve) => (finishSearch = resolve)));
    const { element, settle } = await render(ExportPage, {
      api,
      providers: [{ provide: DESKTOP_BRIDGE, useValue: null }],
    });
    const radio = (value: string) =>
      element.querySelector<HTMLInputElement>(`input[name=format][value="${value}"]`)!;
    await until(settle, () => !radio('html').disabled);
    expect(text(radio('pdf').closest('label'))).toContain(E.pdfSearching);

    radio('html').click();
    await settle();
    finishSearch(capabilities);
    await until(settle, () => text(radio('pdf').closest('label')).includes(E.pdfMissing));
    expect(radio('html').checked).toBe(true);
    await wait(SAVE_DELAY);
    await settle();
    expect(api.saveExportSettings.mock.calls.at(-1)![0].format).toBe('html');
  });

  it('locks the options until the remembered settings have arrived', async () => {
    let answer!: (state: ExportSettingsResponse) => void;
    const api = new FakeApi();
    api.project = testProject({ title: 'Roman' });
    const state = {
      ...api.exportState,
      settings: { ...TEST_EXPORT_SETTINGS, format: 'epub' as const },
    };
    api.exportSettings.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    const { element, settle } = await render(ExportPage, {
      api,
      providers: [{ provide: DESKTOP_BRIDGE, useValue: null }],
    });
    const radio = (value: string) =>
      element.querySelector<HTMLInputElement>(`input[name=format][value="${value}"]`)!;
    expect(radio('html').disabled).toBe(true);
    expect(button(element, E.download).disabled).toBe(true);

    answer(state);
    await until(settle, () => !radio('html').disabled);
    expect(radio('epub').checked).toBe(true);
    expect(button(element, E.download).disabled).toBe(false);
  });

  it('shows templates and a preview only for formats with a fixed page', async () => {
    const { element, choose, legends } = await setup();
    await choose('format', 'epub');
    expect(legends()).not.toContain(E.template);
    expect(element.querySelector('wm-export-preview')).toBeNull();
    expect(text(element.querySelector('.preview-none'))).toBe(E.previewNone);
    // EPUB is where the cover matters
    expect(element.querySelector('wm-cover-picker')).not.toBeNull();
  });

  it('remembers changes in the book shortly after making them', async () => {
    const { api, element, choose, settle } = await setup();
    await choose('template', 'roman');
    const pageSize = element.querySelector<HTMLSelectElement>('select')!;
    pageSize.value = '0';
    pageSize.dispatchEvent(new Event('change'));
    await settle();
    await wait(SAVE_DELAY);
    await settle();
    expect(api.saveExportSettings).toHaveBeenCalledTimes(1);
    expect(api.saveExportSettings.mock.calls[0]![0]).toMatchObject({
      template: 'roman',
      layout: { pageWidth: 120, pageHeight: 190 },
    });
  });

  it('ignores an empty number field and keeps valid numbers', async () => {
    const { api, element, choose, settle } = await setup();
    await choose('template', 'roman');
    const fontSize = [...element.querySelectorAll<HTMLInputElement>('input[type=number]')].find(
      (input) => input.closest('label')?.textContent?.includes(E.fontSize),
    )!;
    // A number field reports '' for anything it cannot parse.
    fontSize.value = '';
    fontSize.dispatchEvent(new Event('change'));
    fontSize.value = '12.5';
    fontSize.dispatchEvent(new Event('change'));
    await settle();
    await wait(SAVE_DELAY);
    await settle();
    expect(api.saveExportSettings.mock.calls.at(-1)![0].layout.fontSize).toBe(12.5);
  });

  it('reloads the preview when scene titles are switched on', async () => {
    const { api, element, settle } = await setup();
    element.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    await until(settle, () => api.exportPreview.mock.calls.length === 2);
    expect(api.exportPreview).toHaveBeenLastCalledWith(true);
  });

  it('downloads in browser mode, with the editor saved first and warnings shown', async () => {
    const flush = vi.fn(async () => undefined);
    const { api, element, submit, settle } = await setup((api) => {
      api.exportDownload.mockResolvedValueOnce({
        blob: new Blob(['x']),
        fileName: 'Roman.docx',
        warnings: ['Ein Bild fehlt.'],
      });
    });
    TestBed.inject(PendingSaves).register(flush);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await submit();
    await until(settle, () => !!element.querySelector('.result'));
    expect(flush).toHaveBeenCalled();
    expect(api.exportDownload).toHaveBeenCalledWith(expect.objectContaining({ format: 'docx' }));
    expect(text(element.querySelector('.result'))).toBe(`${E.downloaded} Roman.docx`);
    expect([...element.querySelectorAll('.warnings li')].map(text)).toEqual(['Ein Bild fehlt.']);
    click.mockRestore();
  });

  it('shows the message of a failed download (the error arrives as a blob)', async () => {
    const { element, submit, settle } = await setup((api) => {
      const body = new Blob([JSON.stringify({ message: 'pdfLaTeX ist abgestürzt.' })]);
      api.exportDownload.mockRejectedValueOnce(new HttpErrorResponse({ error: body, status: 500 }));
    });
    await submit();
    await until(settle, () => !!element.querySelector('[role=alert]'));
    expect(text(element.querySelector('[role=alert]'))).toBe('pdfLaTeX ist abgestürzt.');
  });

  describe('desktop', () => {
    it('exports via the save dialog and opens or shows the file', async () => {
      const { api, bridge, element, submit, settle } = await setup(undefined, true);
      expect(text(button(element, E.exportWithDialog))).toBe(E.exportWithDialog);
      await submit();
      await until(settle, () => !!element.querySelector('.result'));
      expect(bridge!.showExportDialog).toHaveBeenCalledWith('Roman', 'docx');
      expect(api.exportToFile).toHaveBeenCalledWith(
        expect.objectContaining({ filePath: '/home/test/Roman.docx' }),
      );

      button(element, E.open).click();
      button(element, E.showInFolder).click();
      expect(bridge!.openPath).toHaveBeenCalledWith('/home/test/Roman.docx');
      expect(bridge!.showItemInFolder).toHaveBeenCalledWith('/home/test/Roman.docx');
    });

    it('exports nothing when the save dialog is cancelled', async () => {
      const { api, bridge, submit, settle } = await setup(undefined, true);
      bridge!.showExportDialog.mockResolvedValueOnce(null);
      await submit();
      await settle();
      expect(api.exportToFile).not.toHaveBeenCalled();
    });
  });
});
