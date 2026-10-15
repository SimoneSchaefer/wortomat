// Starts the real backend for the end-to-end tests: serves the built frontend and keeps every
// file it touches (project list, books, downloads) in a throwaway folder, so a developer's own
// books and ~/Downloads are never involved.
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const tmp = path.join(import.meta.dirname, '.tmp');

rmSync(tmp, { recursive: true, force: true });
for (const dir of ['data', 'books', 'downloads'])
  mkdirSync(path.join(tmp, dir), { recursive: true });

process.env['WORTOMAT_DATA_DIR'] = path.join(tmp, 'data');
process.env['WORTOMAT_PROJECT_DIR'] = path.join(tmp, 'books');
process.env['WORTOMAT_DOWNLOADS_DIR'] = path.join(tmp, 'downloads');
process.env['WORTOMAT_STATIC_DIR'] = path.join(root, 'apps/frontend/dist/frontend/browser');

await import('../apps/backend/dist/main.js');
