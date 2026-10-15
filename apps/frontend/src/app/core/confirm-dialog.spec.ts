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
  it('zeigt Frage und Hinweis und liefert „ja“ beim Bestätigen', async () => {
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

  it('setzt den Fokus auf „Abbrechen“, damit ein versehentliches Enter nichts löscht', async () => {
    const { dialog, ask, settle } = await setup();
    void ask();
    await settle();
    expect(document.activeElement).toBe(button(dialog, de.confirm.cancel));
  });

  it('liefert „nein“ bei Abbrechen, Escape und Klick auf den Hintergrund', async () => {
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

  it('zeigt bei harmlosen Fragen keinen Hinweis und keinen roten Knopf', async () => {
    const { dialog, ask, settle } = await setup();
    void ask({ ...DELETE_SCENE, confirmLabel: 'Übernehmen', destructive: false } as never);
    await settle();
    expect(text(dialog.querySelector('p'))).not.toContain(de.confirm.irreversible);
    expect(button(dialog, 'Übernehmen').classList).not.toContain('danger');
  });

  it('bricht eine noch offene Frage ab, wenn eine neue kommt', async () => {
    const { ask } = await setup();
    const first = ask();
    void ask({ ...DELETE_SCENE, title: 'Kapitel löschen?' });
    expect(await first).toBe(false);
  });
});
