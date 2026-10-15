import { addChapter, addScene, createBook, expect, expectSaved, test } from './fixtures';

test('creates a character and links it to a scene', async ({ page }) => {
  await createBook(page, 'Die Lotsin');
  await addChapter(page, 'Hafen');
  await addScene(page, 'Hafen', 'Nebel');

  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Charaktere' })
    .click();
  await page.getByRole('button', { name: '+ Charakter' }).click();
  await expect(page).toHaveURL(/\/write\/characters\//);
  const title = page.getByRole('textbox', { name: 'Titel' });
  await title.fill('Greta Olsen');
  await title.press('Enter');
  await page
    .getByRole('textbox', { name: 'Kurzbeschreibung' })
    .fill('Lotsin, 52, kennt jede Sandbank');
  await expectSaved(page);

  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Manuskript' })
    .click();
  await page.getByRole('link', { name: 'Nebel' }).click();
  await page.getByRole('button', { name: 'Charakter hinzufügen' }).click();
  await page
    .getByRole('dialog', { name: 'Charakter hinzufügen' })
    .getByRole('combobox')
    .fill('Greta');
  await page.getByRole('option', { name: /Greta Olsen/ }).click();

  const chip = page.locator('.chip').filter({ hasText: 'Greta Olsen' });
  await expect(chip).toBeVisible();
  await page.reload();
  await chip.getByRole('button', { name: 'Greta Olsen' }).click();
  await expect(page).toHaveURL(/\/write\/characters\//);
  await expect(page.getByRole('textbox', { name: 'Kurzbeschreibung' })).toHaveValue(
    'Lotsin, 52, kennt jede Sandbank',
  );
});
