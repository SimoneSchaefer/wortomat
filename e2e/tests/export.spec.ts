import { readFile } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { addChapter, addScene, createBook, editor, expect, expectSaved, test } from './fixtures';

test.beforeEach(async ({ page }) => {
  await createBook(page, 'Leuchtfeuer');
  await addChapter(page, 'Die Insel');
  await addScene(page, 'Die Insel', 'Ankunft');
  await editor(page).click();
  await page.keyboard.type('Das Boot legte im Morgengrauen an.');
  await expectSaved(page);
  await page.getByRole('button', { name: 'Menü' }).click();
});

test('exports the manuscript as HTML', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  await chooseFormat(page, 'HTML');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Herunterladen' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(/\.html$/);
  const html = await readFile(await download.path(), 'utf8');
  expect(html).toContain('Die Insel');
  expect(html).toContain('Das Boot legte im Morgengrauen an.');
});

test('exports the manuscript as Word document', async ({ page }) => {
  await page.getByRole('button', { name: 'Export' }).click();
  await chooseFormat(page, 'Word (.docx)');

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Herunterladen' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(/\.docx$/);
  // A .docx is a zip archive, which starts with "PK".
  const bytes = await readFile(await download.path());
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
});

test('creates a proofreading copy for the phone', async ({ page }) => {
  await page.getByRole('button', { name: 'Korrektur' }).click();

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Korrekturfassung erstellen …' }).click();
  const download = await downloading;

  expect(download.suggestedFilename()).toMatch(/\.html$/);
  const html = await readFile(await download.path(), 'utf8');
  expect(html).toContain('Das Boot legte im Morgengrauen an.');
  await expect(page.getByText(`Heruntergeladen: ${download.suggestedFilename()}`)).toBeVisible();
});

// The radio buttons are hidden behind styled cards, so pick the card as a user would.
async function chooseFormat(page: Page, label: string): Promise<void> {
  // Loading the remembered settings sets the format, so a choice made earlier would be lost.
  await expect(page.getByRole('button', { name: 'Herunterladen' })).toBeVisible();
  await expect(page.getByText('Suche pdfLaTeX …')).toBeHidden();
  await page.locator('label.choice').filter({ hasText: label }).click();
  await expect(page.getByRole('radio', { name: label })).toBeChecked();
}
