import { addChapter, addScene, createBook, editor, expect, expectSaved, test } from './fixtures';

test('finds text across scenes and opens the hit', async ({ page }) => {
  await createBook(page, 'Das Archiv');
  await addChapter(page, 'Erster Teil');
  await addScene(page, 'Erster Teil', 'Keller');
  await editor(page).click();
  await page.keyboard.type('Unter dem Staub lag ein Brief ohne Absender.');
  await expectSaved(page);
  await addScene(page, 'Erster Teil', 'Dachboden');
  await editor(page).click();
  await page.keyboard.type('Oben war es still.');
  await expectSaved(page);

  const search = page.getByRole('combobox', { name: 'Im ganzen Buch suchen' });
  await search.fill('Absender');
  const hit = page.getByRole('listbox', { name: 'Suchergebnisse' }).getByRole('option');
  await expect(hit).toHaveCount(1);
  await expect(hit).toContainText('Keller');
  await hit.click();

  await expect(page.locator('.doc-title')).toHaveValue('Keller');
  await expect(editor(page)).toContainText('Brief ohne Absender');
});
