import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { DESKTOP_BRIDGE } from '../../core/desktop-bridge';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { StatusMessages } from '../../core/status-messages';
import { FakeApi, fakeDesktop, testProject } from '../../testing/fake-api';
import { button, render, text, until } from '../../testing/render';
import { ProofreadingPage } from './proofreading-page';

@Component({ template: '' })
class Blank {}

const P = de.proofreading;

function inboxWithNews(api: FakeApi): void {
  api.inboxState = {
    dir: '/home/test/Downloads',
    newNotes: 3,
    files: [
      {
        name: 'Roman.notizen.txt',
        modifiedAt: new Date().toISOString(),
        notes: 3,
        newNotes: 3,
        done: false,
      },
      {
        name: 'Roman.notizen(1).txt',
        modifiedAt: '2026-10-01T10:00:00.000Z',
        notes: 2,
        newNotes: 0,
        done: true,
      },
    ],
  };
}

async function setup(prepare: (api: FakeApi) => void = () => undefined, desktop = false) {
  const api = new FakeApi();
  api.project = testProject({ title: 'Roman' });
  prepare(api);
  const bridge = desktop ? fakeDesktop() : null;
  const view = await render(ProofreadingPage, {
    api,
    providers: [{ provide: DESKTOP_BRIDGE, useValue: bridge }],
    before: () => TestBed.inject(ProjectStore).reload(),
    routes: [
      { path: 'write', component: Blank },
      { path: 'write/scene/:id', component: Blank },
    ],
  });
  await until(view.settle, () => api.proofInbox.mock.calls.length > 0);
  await view.settle();
  const status = () => [...view.element.querySelectorAll('[role=status]')].map(text);
  return { ...view, bridge, status, confirm: TestBed.inject(ConfirmDialog) };
}

describe('ProofreadingPage', () => {
  it('says when there are no new notes in the downloads folder', async () => {
    const { element } = await setup();
    expect(text(element.querySelector('section:nth-of-type(2) p'))).toBe(
      P.inboxEmpty('/home/test/Downloads'),
    );
  });

  it('imports new notes from the downloads folder and refreshes the tree', async () => {
    const { api, element, status, settle } = await setup((api) => {
      inboxWithNews(api);
      api.importResult = { applied: 2, skipped: 1, unmatched: [] };
    });
    expect(status()[0]).toContain(de.workspace.newProofNotes(3));
    expect(status()[0]).toContain('Roman.notizen.txt');

    const nodeLoads = api.listNodes.mock.calls.length;
    button(element, P.importInbox).click();
    await until(settle, () => status().some((s) => s.startsWith(P.applied(2))));
    expect(status().find((s) => s.startsWith(P.applied(2)))).toContain(P.skipped(1));
    expect(api.listNodes.mock.calls.length).toBe(nodeLoads + 1);
  });

  it('lists notes whose passage could not be found, linked to their scene', async () => {
    const { element, settle } = await setup((api) => {
      inboxWithNews(api);
      api.importResult = {
        applied: 0,
        skipped: 0,
        unmatched: [
          {
            note: {
              id: 'n1',
              sceneId: 's1',
              paragraph: 0,
              quote: 'der alte Mann',
              prefix: '',
              suffix: '',
              note: 'Name?',
              suggestion: 'Herr Brandt',
              createdAt: '2026-10-01T10:00:00.000Z',
            },
            sceneTitle: 'Ankunft',
          },
        ],
      };
    });
    button(element, P.importInbox).click();
    await until(settle, () => !!element.querySelector('.unmatched'));
    const entry = element.querySelector('.unmatched li')!;
    expect(entry.querySelector('a')?.getAttribute('href')).toBe('/write/scene/s1');
    expect(text(entry.querySelector('blockquote'))).toBe(P.quote('der alte Mann'));
    expect(text(entry.querySelector('.suggestion'))).toBe(P.suggestion('Herr Brandt'));
    expect(text(entry.querySelector('.note'))).toBe('Name?');
  });

  it('imports a notes file picked by hand', async () => {
    const { api, element, settle, status } = await setup((api) => {
      api.importResult = { applied: 1, skipped: 0, unmatched: [] };
    });
    const file = {
      format: 'wortomat-proof-notes',
      version: 1,
      packageId: 'p1',
      title: 'Roman',
      exportedAt: '2026-10-01T10:00:00.000Z',
      notes: [],
    };
    const input = element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', {
      value: [new File([JSON.stringify(file)], 'Roman.notizen.txt', { type: 'text/plain' })],
    });
    input.dispatchEvent(new Event('change'));
    await until(settle, () => status().some((s) => s.startsWith(P.applied(1))));
    expect(api.importProofNotes).toHaveBeenCalledWith(file);
  });

  it('refuses a file that is no notes file', async () => {
    const { api, element, settle } = await setup();
    const input = element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['kein JSON'], 'x.txt')] });
    input.dispatchEvent(new Event('change'));
    await until(settle, () => TestBed.inject(StatusMessages).messages().length > 0);
    expect(TestBed.inject(StatusMessages).messages()[0]?.text).toBe(P.unreadable);
    expect(api.importProofNotes).not.toHaveBeenCalled();
  });

  it('deletes finished notes files only after confirmation', async () => {
    const { api, element, confirm, settle, status } = await setup(inboxWithNews);
    button(element, P.clean(1)).click();
    await settle();
    expect(confirm.pending()?.message).toBe(P.cleanMessage(1, '/home/test/Downloads'));
    confirm.answer(true);
    await until(settle, () => status().includes(P.cleaned(1)));
    expect(api.cleanProofInbox).toHaveBeenCalled();
  });

  it('downloads the proofreading copy in browser mode, with the editor saved first', async () => {
    const flush = vi.fn(async () => undefined);
    const { api, element, settle, status } = await setup();
    TestBed.inject(PendingSaves).register(flush);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    button(element, P.create).click();
    await until(settle, () => status().length > 0);
    expect(flush).toHaveBeenCalled();
    expect(api.proofCopyDownload).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(status()[0]).toBe(P.downloadedAs('Buch – Korrekturfassung.html'));
    click.mockRestore();
  });

  it('saves the copy via the native dialog on the desktop and shows it in its folder', async () => {
    const { api, bridge, element, settle, status } = await setup(undefined, true);
    button(element, P.create).click();
    await until(settle, () => status().length > 0);
    expect(bridge!.showExportDialog).toHaveBeenCalledWith('Roman – Korrekturfassung', 'html');
    expect(api.proofCopyToFile).toHaveBeenCalledWith('/home/test/Roman – Korrekturfassung.html');
    button(element, P.showInFolder).click();
    expect(bridge!.showItemInFolder).toHaveBeenCalledWith(
      '/home/test/Roman – Korrekturfassung.html',
    );
  });

  it('creates nothing when the save dialog is cancelled', async () => {
    const { api, bridge, element, settle } = await setup(undefined, true);
    bridge!.showExportDialog.mockResolvedValueOnce(null);
    button(element, P.create).click();
    await settle();
    await settle();
    expect(api.proofCopyToFile).not.toHaveBeenCalled();
    expect(button(element, P.create).disabled).toBe(false);
  });
});
