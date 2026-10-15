import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { addChapter, addScene, createBook, editor, expect, expectSaved, test } from './fixtures';
import { downloadsDir } from './server-paths';

test('takes notes from the phone copy back into the book', async ({ page, context }) => {
  await createBook(page, 'Die Fähre');
  await addChapter(page, 'Überfahrt');
  await addScene(page, 'Überfahrt', 'An Deck');
  await editor(page).click();
  await page.keyboard.type('Der Wind war kallt. Die Möwen schrien über dem Wasser.');
  await expectSaved(page);

  // Desktop: create the proofreading copy.
  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('button', { name: 'Korrektur' }).click();
  const copying = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Korrekturfassung erstellen …' }).click();
  const copy = await readFile(await (await copying).path(), 'utf8');

  // Phone: the copy is a single offline HTML file. Served from an origin of its own, as the
  // phone opens it from a file, apart from the Wortomat app.
  const phone = await context.newPage();
  await phone.route('https://handy.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: copy }),
  );
  await phone.goto('https://handy.test/Die%20F%C3%A4hre.html');
  await phone.getByRole('button', { name: /Überfahrt/ }).click();

  await select(phone, 'kallt');
  await phone.getByRole('button', { name: 'Vorschlag', exact: true }).click();
  await phone.keyboard.type('kalt');
  await phone.getByRole('button', { name: 'Speichern' }).click();

  await select(phone, 'Möwen');
  await phone.getByRole('button', { name: 'Notiz', exact: true }).click();
  await phone.keyboard.type('Welche Art? Silbermöwen?');
  await phone.getByRole('button', { name: 'Speichern' }).click();

  await phone.getByRole('button', { name: /Übersicht/ }).click();
  const sending = phone.waitForEvent('download');
  await phone.getByRole('button', { name: 'Notizen senden' }).click();
  const notes = await sending;
  expect(notes.suggestedFilename()).toBe('Die Fähre.notizen.txt');
  // Arrives in the downloads folder, e.g. via GSConnect or as a mail attachment.
  await notes.saveAs(path.join(downloadsDir, notes.suggestedFilename()));
  await phone.close();

  // Desktop: the inbox picks the file up.
  await page.reload();
  await expect(page.getByText('2 neue Notizen vom Handy')).toBeVisible();
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(page.getByText('2 Notizen übernommen.')).toBeVisible();

  // The notes are marks in the text; accepting the suggestion replaces the word.
  await page.getByRole('button', { name: 'Zurück' }).click();
  await page.getByRole('link', { name: 'An Deck' }).click();
  await expect(page.getByRole('button', { name: '2 Markierungen' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
  await page.getByRole('button', { name: /„kalt“ statt „kallt“/ }).click();
  await page.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(editor(page)).toContainText('Der Wind war kalt.');
  await expect(page.getByText('Welche Art? Silbermöwen?')).toBeVisible();
  await expectSaved(page);

  await page.reload();
  await expect(editor(page)).toContainText('Der Wind war kalt.');
});

/** Selects text in the phone copy, as a finger would. */
async function select(phone: Page, text: string): Promise<void> {
  await phone.evaluate((text) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const start = node.textContent!.indexOf(text);
      if (start < 0 || !node.parentElement?.closest('p[data-paragraph]')) continue;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + text.length);
      getSelection()!.removeAllRanges();
      getSelection()!.addRange(range);
      return;
    }
    throw new Error(`"${text}" is not in the text`);
  }, text);
}
