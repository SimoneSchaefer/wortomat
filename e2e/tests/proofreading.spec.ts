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

test('shows the plot in the phone copy and jumps from a scene to its text', async ({
  page,
  context,
}) => {
  await createBook(page, 'Die Insel');
  await seedLongPlot(page);
  // Through the API: the download itself is covered above
  const copy = await (await page.request.post('/api/proofreading/export', { data: {} })).text();

  const phone = await context.newPage();
  await phone.setViewportSize({ width: 375, height: 700 });
  await phone.route('https://handy.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: copy }),
  );
  await phone.goto('https://handy.test/Die%20Insel.html');
  await phone.getByRole('button', { name: 'Handlung ansehen' }).click();
  await expect(phone.getByRole('heading', { name: 'Handlung' })).toBeVisible();
  await expect(phone.locator('.plot-node')).toHaveCount(16);
  await expect(phone.locator('.plot-lane')).toHaveText(['Mara', 'Jon']);
  // Time runs downwards, Jon's column is right of Mara's
  const centre = async (title: string) => {
    const box = (await phone.getByRole('button', { name: title, exact: true }).boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  expect((await centre('Szene 2')).y).toBeGreaterThan((await centre('Szene 1')).y);
  expect((await centre('Szene 2')).x).toBeGreaterThan((await centre('Szene 1')).x);
  // Uses the phone's width: wider than the 44 px minimum per thread (at most 80)
  const drawing = (await phone.locator('.plot-drawing').boundingBox())!;
  expect(drawing.width).toBeGreaterThan(2 * 44);
  expect(drawing.x + drawing.width).toBeLessThanOrEqual(375);

  // The thread names stay right below the bar while scrolling
  await phone.mouse.wheel(0, 2000);
  await expect
    .poll(async () => (await phone.locator('.plot-lanes').boundingBox())!.y)
    .toBeCloseTo((await phone.locator('header.bar').boundingBox())!.height, 0);

  await phone.getByRole('button', { name: 'Wendepunkte (1)' }).click();
  await expect(phone.locator('.plot-node')).toHaveCount(1);
  await phone.getByRole('button', { name: 'Alle Szenen' }).click();
  await expect(phone.locator('.plot-node')).toHaveCount(16);

  await phone.getByRole('button', { name: 'Szene 12', exact: true }).click();
  const info = phone.getByRole('dialog', { name: 'Szene 12' });
  await expect(info).toContainText('Kapitel 2 · Zweiter Tag');
  await expect(info).toContainText('Mara');
  await expect(info).toContainText('Jon');
  await info.getByRole('button', { name: 'Zum Text' }).click();
  await expect(phone.getByRole('heading', { name: 'Zweiter Tag' })).toBeVisible();
  await expect(phone.getByRole('heading', { name: 'Szene 12' })).toBeInViewport();

  // Android's back gesture returns to the plot
  await phone.goBack();
  await expect(phone.getByRole('heading', { name: 'Handlung' })).toBeVisible();
});

/**
 * Two chapters with eight scenes each, long enough to scroll on a phone. Mara in every scene,
 * Jon in every even one; scene 5 is a turning point.
 */
async function seedLongPlot(page: Page): Promise<void> {
  const post = async (url: string, data: object) => (await page.request.post(url, { data })).json();
  const mara = await post('/api/strands', { name: 'Mara', color: 'violet' });
  const jon = await post('/api/strands', { name: 'Jon', color: 'teal' });
  let number = 0;
  for (const title of ['Erster Tag', 'Zweiter Tag']) {
    const chapter = await post('/api/nodes', { kind: 'chapter', parentId: null, title });
    for (let i = 0; i < 8; i++) {
      number++;
      const scene = await post('/api/nodes', {
        kind: 'scene',
        parentId: chapter.id,
        title: `Szene ${number}`,
      });
      const text = `Hier beginnt Szene ${number}. `.repeat(40);
      await page.request.put(`/api/scenes/${scene.id}/content`, {
        data: {
          doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
          text,
          wordCount: 160,
        },
      });
      await post(`/api/scenes/${scene.id}/strands`, { strandId: mara.id });
      if (number % 2 === 0) await post(`/api/scenes/${scene.id}/strands`, { strandId: jon.id });
      if (number === 5) {
        await page.request.patch(`/api/nodes/${scene.id}`, { data: { turningPoint: true } });
      }
    }
  }
}

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
