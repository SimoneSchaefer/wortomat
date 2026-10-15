import { TestBed } from '@angular/core/testing';
import { button, render, text } from '../testing/render';
import { ConfirmDialog, ConfirmDialogHost } from './confirm-dialog';
import { de } from './i18n/de';

const DELETE_SCENE = {
  title: 'Szene löschen?',
  message: '„Ankunft“ wird gelöscht.',
  confirmLabel: 'Löschen',
};

async function setup() {
  const view = await render(ConfirmDialogHost);
  const confirm = TestBed.inject(ConfirmDialog);
  const dialog = view.element.querySelector('dialog')!;
  const ask = async (request = DELETE_SCENE) => {
    const answer = confirm.ask(request);
    await view.settle();
    return answer;
  };
  return { ...view, dialog, ask };
}

describe('ConfirmDialogHost', () => {
  it('shows the question and hint and answers yes on confirming', async () => {
    const { dialog, ask, settle } = await setup();
    const answer = ask();
    await settle();

    expect(dialog.open).toBe(true);
    expect(text(dialog.querySelector('h2'))).toBe('Szene löschen?');
    expect(text(dialog.querySelector('p'))).toContain(de.confirm.irreversible);

    button(dialog, 'Löschen').click();
    expect(await answer).toBe(true);
    await settle();
    expect(dialog.open).toBe(false);
  });

  it('focuses "Cancel" so an accidental Enter deletes nothing', async () => {
    const { dialog, ask, settle } = await setup();
    void ask();
    await settle();
    expect(document.activeElement).toBe(button(dialog, de.confirm.cancel));
  });

  it('answers no on Cancel, Escape and a click on the backdrop', async () => {
    const { dialog, ask, settle } = await setup();

    const cancelled = ask();
    await settle();
    button(dialog, de.confirm.cancel).click();
    expect(await cancelled).toBe(false);

    const escaped = ask();
    await settle();
    dialog.dispatchEvent(new Event('cancel'));
    expect(await escaped).toBe(false);

    const outside = ask();
    await settle();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(await outside).toBe(false);
  });

  it('shows neither hint nor red button for harmless questions', async () => {
    const { dialog, ask, settle } = await setup();
    void ask({ ...DELETE_SCENE, confirmLabel: 'Übernehmen', destructive: false } as never);
    await settle();
    expect(text(dialog.querySelector('p'))).not.toContain(de.confirm.irreversible);
    expect(button(dialog, 'Übernehmen').classList).not.toContain('danger');
  });

  it('cancels a question still open when a new one comes', async () => {
    const { ask } = await setup();
    const first = ask();
    void ask({ ...DELETE_SCENE, title: 'Kapitel löschen?' });
    expect(await first).toBe(false);
  });
});
