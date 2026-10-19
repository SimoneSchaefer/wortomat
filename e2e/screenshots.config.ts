import { defineConfig, devices } from '@playwright/test';
import { port } from './tests/server-paths';

/**
 * Takes the screenshots for the project page in docs/ (`npm run screenshots -w @wortomat/e2e`
 * after `npm run build`). Not part of the e2e run: it checks nothing, it only takes pictures.
 */
export default defineConfig({
  testDir: './screenshots',
  workers: 1,
  timeout: 120_000,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  },
  webServer: {
    command: 'node server.mjs',
    url: `http://127.0.0.1:${port}/api/app`,
    env: { PORT: String(port) },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
