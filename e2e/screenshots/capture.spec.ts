import { devices, expect, test, type Browser, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { port } from '../tests/server-paths';
import { seedDemoBook, writingHistory, type DemoIds } from './demo-book';

const books = path.join(__dirname, '..', '.tmp', String(port), 'books');
const out = path.join(__dirname, '..', '..', 'docs', 'screenshots');
const mainBook = path.join(books, 'Das Licht von Kaltenhafen.wortomat');

let ids: DemoIds;

async function shoot(page: Page, name: string) {
  // Let transitions and lazy images settle.
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
}

/** Each main and side character gets their own variant of the mascot. */
const portraits: Array<{
  character: string;
  svg: string;
  hue: number;
  background: string;
  flip?: boolean;
}> = [
  { character: 'Mara Lindqvist', svg: 'maskottchen.svg', hue: 0, background: '#e4f2c7' },
  {
    character: 'Ella Lindqvist',
    svg: 'maskottchen-schlafend.svg',
    hue: 150,
    background: '#dfe6f7',
  },
  { character: 'Jonas Brandt', svg: 'maskottchen.svg', hue: 90, background: '#dcefee', flip: true },
  { character: 'Hinnerk Feddersen', svg: 'maskottchen.svg', hue: -55, background: '#f6e7cf' },
  {
    character: 'Frau Petersen',
    svg: 'maskottchen.svg',
    hue: 200,
    background: '#f7e0e6',
    flip: true,
  },
];

/**
 * A mascot picture in the gallery's 4:3 format, so it fills it without bars. The backend takes
 * no SVG, so the browser renders it to PNG; the colour comes from a hue rotation.
 */
async function mascotPortrait(
  browser: Browser,
  { svg, hue, background, flip }: (typeof portraits)[number],
): Promise<Buffer> {
  const source = readFileSync(path.join(__dirname, '../../apps/frontend/public', svg));
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.setContent(
    `<body style="margin:0;display:grid;place-items:center;height:100vh;background:${background}">
      <img style="height:62%;filter:hue-rotate(${hue}deg);transform:scaleX(${flip ? -1 : 1})"
        src="data:image/svg+xml;base64,${source.toString('base64')}"></body>`,
  );
  const png = await page.screenshot();
  await page.close();
  return png;
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request, browser }) => {
  await request.patch('/api/settings', {
    data: {
      language: 'de',
      theme: 'light',
      revisionMode: false,
      plotView: { order: 'story', onlyTurningPoints: false, compact: false, vertical: false },
    },
  });
  // Other books first, so that the sample novel is the most recent one on the start page.
  for (const [title, author] of [
    ['Die Uhrmacherin', 'Simone Schäfer'],
    ['Sommer in Lissabon', 'Simone Schäfer'],
  ]) {
    await request.post('/api/project/create', {
      data: { filePath: path.join(books, `${title}.wortomat`), title, author },
    });
    await request.post('/api/project/close');
  }
  await request.post('/api/project/create', {
    data: { filePath: mainBook, title: 'Das Licht von Kaltenhafen', author: 'Simone Schäfer' },
  });
  ids = await seedDemoBook(request);
  for (const portrait of portraits)
    await request.post(`/api/notes/${ids.notes[portrait.character]}/images`, {
      multipart: {
        file: {
          name: 'portrait.png',
          mimeType: 'image/png',
          buffer: await mascotPortrait(browser, portrait),
        },
        width: '1200',
        height: '900',
      },
    });
  await request.post('/api/project/close');

  // The writing log only grows by writing, so the history goes straight into the file.
  const db = new DatabaseSync(mainBook);
  const insert = db.prepare(
    'INSERT INTO writing_log (day, scene_id, added, removed, pasted) VALUES (?, ?, ?, ?, 0)',
  );
  for (const { day, added, removed } of writingHistory(new Date()))
    insert.run(day, ids.scenes['Der Turm'], added, removed);
  db.close();
});

test('start page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.start .carousel')).toBeVisible();
  // The throwaway folder of the test server would look odd on the project page.
  await page
    .locator('.book-path')
    .evaluate((el) => (el.textContent = '~/Bücher/Das Licht von Kaltenhafen.wortomat'));
  await shoot(page, 'start');
});

test('workspace', async ({ page, request }) => {
  await request.post('/api/project/open', { data: { filePath: mainBook } });

  await page.goto(`/write/scene/${ids.scenes['Der Turm']}`);
  await expect(page.locator('.ProseMirror')).toContainText('Zweihundertelf');
  await shoot(page, 'scene');

  await page.goto(`/write/scene/${ids.scenes['Ellas Brief']}`);
  await expect(page.locator('.ProseMirror')).toContainText('Frau Petersen');
  await shoot(page, 'scene-annotations');

  // Only Mara's strand: the tree shows just her scenes.
  await page.getByRole('button', { name: 'Filter' }).click();
  const filter = page.getByRole('dialog', { name: 'Filter' });
  await filter.getByRole('button', { name: 'Mara', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /von/ })).toBeVisible();
  await shoot(page, 'filter');
  await page.keyboard.press('Escape');

  await page.goto(`/write/characters/${ids.notes['Mara Lindqvist']}`);
  await expect(page.locator('.ProseMirror')).toBeVisible();
  await shoot(page, 'character');

  await page.goto('/write/plot');
  await expect(page.getByText('Morgengrauen')).toBeVisible();
  await shoot(page, 'plot');

  await page.goto(`/write/places/maps/${ids.map}`);
  await shoot(page, 'map');

  await page.goto('/write/stats');
  await shoot(page, 'stats');

  await page.goto(`/write/scene/${ids.scenes['Die Fähre']}`);
  await expect(page.locator('.ProseMirror')).toContainText('Nebel');
  await page.getByRole('combobox', { name: /suchen/i }).fill('leuchtturm');
  await expect(page.locator('#search-results')).toBeVisible();
  await shoot(page, 'search');
  await page.keyboard.press('Escape');

  await page.goto('/export');
  // The options stay locked until the export settings have loaded.
  await expect(page.getByRole('radio', { name: /^Roman/ })).toBeEnabled();
  await page.locator('label.choice', { hasText: 'Buchsatz' }).click();
  await page
    .getByRole('group', { name: 'Vorlage' })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await shoot(page, 'export');
});

test('revision mode', async ({ page, request }) => {
  await request.patch('/api/settings', { data: { revisionMode: true } });
  await page.goto(`/write/scene/${ids.scenes['Im Anker']}`);
  await expect(page.locator('.ProseMirror')).toContainText('Grog');
  await shoot(page, 'revision');
  await request.patch('/api/settings', { data: { revisionMode: false } });
});

test('dark mode', async ({ page, request }) => {
  await request.patch('/api/settings', { data: { theme: 'dark' } });
  await page.goto('/write/plot');
  await expect(page.getByText('Morgengrauen')).toBeVisible();
  await page.getByRole('radio', { name: 'Senkrecht' }).click();
  await shoot(page, 'plot-dark');
  await page.getByRole('radio', { name: 'Waagerecht' }).click();
  await page.goto(`/write/scene/${ids.scenes['Der Turm']}`);
  await expect(page.locator('.ProseMirror')).toContainText('Zweihundertelf');
  await shoot(page, 'scene-dark');
  await request.patch('/api/settings', { data: { theme: 'light' } });
});

test('light and dark side by side', async ({ page }) => {
  // The same scene in both themes, split diagonally – the first picture on the project page.
  const image = (name: string) =>
    `data:image/png;base64,${readFileSync(path.join(out, `${name}.png`)).toString('base64')}`;
  await page.setContent(`
    <style>
      body { margin: 0; }
      img { position: absolute; inset: 0; width: 100%; height: 100%; }
      .dark { clip-path: polygon(58% 0, 100% 0, 100% 100%, 42% 100%); }
    </style>
    <img src="${image('scene')}"><img class="dark" src="${image('scene-dark')}">`);
  await shoot(page, 'scene-split');
});

test('proofreading copy on the phone', async ({ browser, request }) => {
  const copy = await (await request.post('/api/proofreading/export', { data: {} })).text();
  const context = await browser.newContext({ ...devices['Pixel 7'], locale: 'de-DE' });
  const phone = await context.newPage();
  await phone.route('https://handy.test/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: copy }),
  );
  await phone.goto('https://handy.test/Das%20Licht%20von%20Kaltenhafen.html');
  await expect(phone.getByRole('button', { name: '1 Ankunft' })).toBeVisible();
  await shoot(phone, 'phone-start');
  await phone.getByRole('button', { name: '1 Ankunft' }).click();
  await expect(phone.getByText('Die Fähre legte an')).toBeVisible();
  await shoot(phone, 'phone');
  await context.close();
});
