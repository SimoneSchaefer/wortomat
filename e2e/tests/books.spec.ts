import { addChapter, addScene, createBook, editor, expect, expectSaved, test } from './fixtures';

test('closes a book and opens it again from the start page', async ({ page }) => {
  await createBook(page, 'Nachtzug nach Triest');
  await addChapter(page, 'Abfahrt');
  await addScene(page, 'Abfahrt', 'Gleis 7');
  await editor(page).click();
  await page.keyboard.type('Sie kam zu spät.');
  await expectSaved(page);

  await page.getByRole('button', { name: 'Menü' }).click();
  await page.getByRole('button', { name: 'Projekt schließen' }).click();
  await expect(page).toHaveURL(/\/$/);

  const details = page.locator('.details');
  await expect(details.locator('.book-title')).toHaveText('Nachtzug nach Triest');
  await expect(details).toContainText('4 Wörter');
  await details.getByRole('button', { name: 'Öffnen', exact: true }).click();

  await expect(page).toHaveURL(/\/write/);
  await page.getByRole('link', { name: 'Gleis 7' }).click();
  await expect(editor(page)).toHaveText('Sie kam zu spät.');
});
