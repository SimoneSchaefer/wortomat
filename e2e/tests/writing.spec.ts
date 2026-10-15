import {
  addChapter,
  addScene,
  createBook,
  editor,
  expect,
  expectSaved,
  manuscript,
  test,
} from './fixtures';

test('writes a scene and keeps the text after a reload', async ({ page }) => {
  await createBook(page, 'Die Häuser am Fluss');
  await addChapter(page, 'Ankunft');
  await addScene(page, 'Ankunft', 'Am Bahnhof');

  await editor(page).click();
  await page.keyboard.type('Der Zug hielt mit einem Ruck. Niemand stieg aus.');
  await expectSaved(page);

  await page.reload();
  await expect(editor(page)).toContainText('Der Zug hielt mit einem Ruck. Niemand stieg aus.');
  await expect(manuscript(page).getByRole('link', { name: 'Am Bahnhof' })).toBeVisible();
  await expect(page.locator('.sidebar-head .word-count')).toHaveText('9 Wörter');
});

test('deletes a scene only after confirming', async ({ page }) => {
  await createBook(page, 'Kurzgeschichten');
  await addChapter(page, 'Sommer');
  await addScene(page, 'Sommer', 'Der Steg');
  await addScene(page, 'Sommer', 'Gewitter');

  const row = manuscript(page).locator('li.scene').filter({ hasText: 'Der Steg' });
  await row.hover();
  await row.getByRole('button', { name: 'Löschen' }).click();
  const dialog = page.getByRole('dialog', { name: 'Szene löschen?' });
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeVisible();

  await row.hover();
  await row.getByRole('button', { name: 'Löschen' }).click();
  await dialog.getByRole('button', { name: 'Löschen' }).click();
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeHidden();

  await page.reload();
  await expect(manuscript(page).getByRole('link', { name: 'Gewitter' })).toBeVisible();
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeHidden();
});
