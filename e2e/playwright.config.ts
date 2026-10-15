import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env['E2E_PORT'] ?? 3101);

export default defineConfig({
  testDir: './tests',
  // The backend has exactly one open book, so tests must not run side by side.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'de-DE',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The app is also used in Firefox (browser mode), not only in Electron's Chromium.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    // Needs `npm run build` first: it serves the built frontend, not `ng serve`.
    command: 'node server.mjs',
    url: `http://127.0.0.1:${port}/api/app`,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
