import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { createBook, expect, test } from './fixtures';

test.beforeEach(async ({ page, request }) => {
  // The plot view is an app setting and outlives the book, e.g. from the other browser's run.
  await request.patch('/api/settings', {
    data: {
      plotView: { order: 'story', onlyTurningPoints: false, compact: false, vertical: false },
    },
  });
  await createBook(page, 'Zwei Leben');
  await seedPlot(page.request);
  await page.reload();
  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Handlung' })
    .click();
});

test('turns the plot view vertical and keeps it that way', async ({ page }) => {
  const direction = page.getByRole('radiogroup', { name: 'Richtung' });
  await expect(direction.getByRole('radio', { name: 'Waagerecht' })).toBeChecked();
  // Horizontal: time runs to the right
  expect((await centre(scene(page, 'Abschied'))).x).toBeGreaterThan(
    (await centre(scene(page, 'Ankunft'))).x,
  );

  await direction.getByRole('radio', { name: 'Senkrecht' }).click();
  await expect(page.locator('.chart.vertical')).toBeVisible();
  await expectVertical(page);

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Senkrecht' })).toBeChecked();
  await expectVertical(page);
});

test('drags a scene downwards in the vertical view', async ({ page }) => {
  await page.getByRole('radio', { name: 'Senkrecht' }).click();
  await expect(page.locator('.chart.vertical')).toBeVisible();
  const from = await centre(scene(page, 'Ankunft'));
  const to = await centre(scene(page, 'Abschied'));

  // Dropped onto another scene, it happens at the same time
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, (from.y + to.y) / 2, { steps: 5 });
  await page.mouse.move(from.x, to.y, { steps: 5 });
  await expect(page.locator('rect.together.drop')).toBeVisible();
  await page.mouse.up();

  // Saved as simultaneous …
  const storyOrder = async (title: string) => {
    const nodes: Array<{ title: string; storyOrder: number | null }> = await (
      await page.request.get('/api/nodes')
    ).json();
    return nodes.find((node) => node.title === title)!.storyOrder;
  };
  await expect.poll(() => storyOrder('Ankunft')).not.toBeNull();
  expect(await storyOrder('Ankunft')).toBe(await storyOrder('Abschied'));
  // The view has taken the new order over once it offers to undo it
  await expect(
    page.getByRole('button', { name: 'Auf Buchreihenfolge zurücksetzen …' }),
  ).toBeVisible();
  await expect(page.locator('rect.together.drop')).toHaveCount(0);

  // … and drawn in one shaded box; both are on Lena's line, so one sits below the other in it
  const together = (await page.locator('rect.together').boundingBox())!;
  for (const title of ['Ankunft', 'Abschied']) {
    const { y } = await centre(scene(page, title));
    expect(y).toBeGreaterThan(together.y);
    expect(y).toBeLessThan(together.y + together.height);
  }
});

test('takes the story order over into the manuscript', async ({ page }) => {
  // In the story, the farewell comes first
  const abschied = scene(page, 'Abschied');
  await abschied.focus();
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page.locator('.node .displaced')).toHaveCount(1);
  await page.keyboard.press('Alt+ArrowLeft');

  await page.getByRole('button', { name: 'Ins Manuskript übernehmen …' }).click();
  const preview = page.getByRole('region', { name: 'Reihenfolge ins Manuskript übernehmen?' });
  await expect(preview.getByRole('listitem')).toHaveText([
    /Abschied.*aus Kapitel 2 „Kapitel zwei“ an den Anfang von Kapitel 1 „Kapitel eins“/,
  ]);
  await preview.getByRole('button', { name: 'Übernehmen' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: '1 Szene im Manuskript verschoben' }),
  ).toBeVisible();
  await expect(page.locator('.node .displaced')).toHaveCount(0);

  await page
    .getByRole('navigation', { name: 'Bereiche' })
    .getByRole('button', { name: 'Manuskript' })
    .click();
  const tree = page.getByRole('navigation', { name: 'Manuskript' });
  await expect(tree.getByRole('link')).toHaveText(['Abschied', 'Ankunft', 'Der Brief']);
  await page.reload();
  await expect(tree.getByRole('link')).toHaveText(['Abschied', 'Ankunft', 'Der Brief']);
  await expect(tree.locator('li.chapter').filter({ hasText: 'Kapitel eins' })).toContainText(
    'Abschied',
  );
});

/** Later scenes further down, the threads side by side. */
async function expectVertical(page: Page): Promise<void> {
  const ankunft = await centre(scene(page, 'Ankunft'));
  const brief = await centre(scene(page, 'Der Brief'));
  const abschied = await centre(scene(page, 'Abschied'));
  expect(brief.y).toBeGreaterThan(ankunft.y);
  expect(abschied.y).toBeGreaterThan(brief.y);
  expect(brief.x).toBeGreaterThan(ankunft.x); // Tom's column is right of Lena's
  const lena = await centre(page.locator('.lanes li').filter({ hasText: 'Lena' }));
  const tom = await centre(page.locator('.lanes li').filter({ hasText: 'Tom' }));
  expect(tom.x).toBeGreaterThan(lena.x);
  expect(tom.y).toBeCloseTo(lena.y, 0);
}

function scene(page: Page, title: string): Locator {
  return page.getByRole('link', { name: `Szene „${title}“ öffnen` });
}

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Chapter 1: Ankunft (Lena), Der Brief (Tom) · Chapter 2: Abschied (Lena + Tom). Through the API:
 * entering strands in the editor is covered elsewhere and would only slow this down.
 */
async function seedPlot(request: APIRequestContext): Promise<void> {
  const post = async (url: string, data: object) => (await request.post(url, { data })).json();
  const lena = await post('/api/strands', { name: 'Lena', color: 'violet' });
  const tom = await post('/api/strands', { name: 'Tom', color: 'teal' });
  const plan = [
    [
      'Kapitel eins',
      [
        ['Ankunft', [lena]],
        ['Der Brief', [tom]],
      ],
    ],
    ['Kapitel zwei', [['Abschied', [lena, tom]]]],
  ] as const;
  for (const [chapterTitle, scenes] of plan) {
    const chapter = await post('/api/nodes', {
      kind: 'chapter',
      parentId: null,
      title: chapterTitle,
    });
    for (const [title, strands] of scenes) {
      const node = await post('/api/nodes', { kind: 'scene', parentId: chapter.id, title });
      for (const strand of strands) {
        await post(`/api/scenes/${node.id}/strands`, { strandId: strand.id });
      }
    }
  }
}
