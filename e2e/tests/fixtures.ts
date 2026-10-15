import { test as base, expect, type Page } from '@playwright/test';

export { expect };

export const test = base.extend<{ freshStart: void }>({
  // The backend remembers the open book across tests, which would skip the start page.
  freshStart: [
    async ({ request }, use) => {
      await request.post('/api/project/close');
      await use();
    },
    { auto: true },
  ],
});

/** Creates a book through the start page; its file lands in the server's throwaway folder. */
export async function createBook(page: Page, title: string): Promise<void> {
  await page.goto('/');
  // The form opens by itself once an empty book list has loaded, and closes again if the list
  // has books; only toggle it after that.
  await expect(page.locator('.start .carousel, .start .empty')).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Neues Buch beginnen' });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await page.getByLabel('Titel').fill(title);
  // Several tests may use the same title, but each needs a file of its own.
  const location = page.getByRole('textbox', { name: /^Speicherort/ });
  const path = await location.inputValue();
  await location.fill(path.replace(/\.wortomat$/, `-${Date.now()}.wortomat`));
  await page.getByRole('button', { name: 'Anlegen' }).click();
  await expect(page).toHaveURL(/\/write$/);
}

/** Adds a chapter at the top level and gives it a title (the tree opens it in rename mode). */
export async function addChapter(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: '+ Kapitel' }).click();
  const input = page.getByLabel('Titel von Neues Kapitel');
  await input.fill(title);
  await input.press('Enter');
  await expect(manuscript(page).getByText(title, { exact: true })).toBeVisible();
}

/** Adds a scene to a chapter; the scene page opens with its title field. */
export async function addScene(page: Page, chapter: string, title: string): Promise<void> {
  const row = manuscript(page).locator('.row').filter({ hasText: chapter });
  await row.hover();
  await row.getByRole('button', { name: 'Szene hinzufügen' }).click();
  // Wait for the new scene itself: the URL alone may still be the previous scene's.
  const titleInput = page.locator('.doc-title');
  await expect(titleInput).toHaveValue('Neue Szene');
  await titleInput.fill(title);
  await titleInput.press('Enter');
  await expect(manuscript(page).getByRole('link', { name: title })).toBeVisible();
}

export function manuscript(page: Page) {
  return page.getByRole('navigation', { name: 'Manuskript' });
}

export function editor(page: Page) {
  return page.locator('.ProseMirror');
}

/** Waits until autosave has written everything; a reload before that would lose text. */
export async function expectSaved(page: Page): Promise<void> {
  await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible();
}
