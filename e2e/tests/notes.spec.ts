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

test('moves a deleted character to its own trash and restores it with its scene link', async ({
  page,
}) => {
  const areas = page.getByRole('navigation', { name: 'Bereiche' });
  const chip = page.locator('.chip').filter({ hasText: 'Greta Olsen' });
  await createBook(page, 'Die Lotsin');
  await addChapter(page, 'Hafen');
  await addScene(page, 'Hafen', 'Nebel');
  await page.getByRole('button', { name: 'Charakter hinzufügen' }).click();
  await page
    .getByRole('dialog', { name: 'Charakter hinzufügen' })
    .getByRole('combobox')
    .fill('Greta Olsen');
  await page.getByRole('option', { name: /Greta Olsen/ }).click();
  await expect(chip).toBeVisible();

  await areas.getByRole('button', { name: 'Charaktere' }).click();
  const list = page.getByRole('navigation', { name: 'Charaktere' });
  await list.getByRole('link', { name: /Greta Olsen/ }).hover();
  await list.getByRole('button', { name: 'Greta Olsen löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'In den Papierkorb' }).click();
  await expect(list.getByRole('link', { name: /Greta Olsen/ })).toBeHidden();

  // The manuscript keeps its own trash, which holds nothing
  await areas.getByRole('button', { name: 'Manuskript' }).click();
  await expect(chip).toBeHidden();
  await expect(page.getByRole('link', { name: /^Papierkorb/ })).toBeHidden();

  await areas.getByRole('button', { name: 'Charaktere' }).click();
  await page.getByRole('link', { name: 'Papierkorb (1)' }).click();
  await expect(page).toHaveURL(/\/write\/characters\/trash$/);
  await page.getByRole('button', { name: 'Greta Olsen wiederherstellen' }).click();
  await expect(page).toHaveURL(/\/write\/characters\/(?!trash)/);
  await expect(page.getByRole('textbox', { name: 'Titel' })).toHaveValue('Greta Olsen');
  await expect(list.getByRole('link', { name: /Greta Olsen/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Papierkorb/ })).toBeHidden();

  await areas.getByRole('button', { name: 'Manuskript' }).click();
  await expect(chip).toBeVisible();
});
