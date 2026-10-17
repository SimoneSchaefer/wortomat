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

test('moves a deleted scene to the trash only after confirming and restores it', async ({
  page,
}) => {
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
  await dialog.getByRole('button', { name: 'In den Papierkorb' }).click();
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeHidden();

  await page.reload();
  await expect(manuscript(page).getByRole('link', { name: 'Gewitter' })).toBeVisible();
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeHidden();

  await page.getByRole('link', { name: 'Papierkorb (1)' }).click();
  await expect(page.locator('wm-trash-page li')).toContainText('Sommer');
  await page.getByRole('button', { name: 'Der Steg wiederherstellen' }).click();
  await expect(page).toHaveURL(/\/write\/scene\//);
  await expect(manuscript(page).getByRole('link', { name: 'Der Steg' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Papierkorb/ })).toBeHidden();
});

test('keeps the cursor and the new text in view while typing a long scene', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 600 });
  await createBook(page, 'Lange Nacht');
  await addChapter(page, 'Eins');
  await addScene(page, 'Eins', 'Die ganze Nacht');
  await editor(page).click();

  const statusbar = page.locator('.statusbar');
  // The cursor sits in the last paragraph: it must stay fully above the status bar at the bottom
  const current = editor(page).locator('p').last();
  for (let line = 1; line <= 25; line++) {
    await page.keyboard.press('Enter');
    await page.keyboard.type(`Zeile ${line}: Sie schrieb weiter, Satz um Satz.`);
    const bar = (await statusbar.boundingBox())!;
    await expect
      .poll(
        async () => {
          const text = (await current.boundingBox())!;
          return text.y + text.height;
        },
        { message: `line ${line}` },
      )
      .toBeLessThanOrEqual(bar.y);
  }

  // Going back up, the line must not disappear behind the toolbar sticking to the top
  const toolbar = page.getByRole('toolbar');
  for (let step = 1; step <= 20; step++) {
    await page.keyboard.press('ArrowUp');
    const bar = (await toolbar.boundingBox())!;
    // Firefox may finish scrolling a moment after the key press
    await expect
      .poll(() => page.evaluate(() => getSelection()!.getRangeAt(0).getBoundingClientRect().top), {
        message: `step ${step}`,
      })
      .toBeGreaterThanOrEqual(bar.y + bar.height);
  }
});
