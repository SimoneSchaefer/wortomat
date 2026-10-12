/**
 * Eigenständiger Start für die Entwicklung im Browser (`npm run dev`).
 * In der fertigen App startet stattdessen die Electron-Shell den Server über `startServer()`.
 */
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from './server.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  version: string;
};
const documentsDir = path.join(os.homedir(), 'Documents');

const server = await startServer({
  mode: 'browser',
  version: packageJson.version,
  defaultProjectDir: existsSync(documentsDir) ? documentsDir : os.homedir(),
  // Eigener Ordner für die Entwicklung, damit die Projektliste der installierten App unberührt bleibt.
  dataDir: process.env['WORTOMAT_DATA_DIR'] ?? path.join(os.homedir(), '.wortomat-dev'),
  port: Number(process.env['PORT'] ?? 3000),
  staticDir: process.env['WORTOMAT_STATIC_DIR'],
});

console.log(`Wortomat-Backend läuft auf ${server.url} (ohne Token – nur für die Entwicklung)`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void server.close().finally(() => process.exit(0));
  });
}
