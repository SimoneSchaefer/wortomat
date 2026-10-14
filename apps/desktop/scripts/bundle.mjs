/**
 * Baut den Inhalt von `apps/desktop/app/` – genau das, was electron-builder einpackt:
 *
 *   app/
 *   ├─ package.json   (ohne Abhängigkeiten)
 *   ├─ main.mjs       (Electron-Hauptprozess + komplettes NestJS-Backend in einer Datei)
 *   ├─ preload.cjs
 *   ├─ icon.png       (Fenster-Icon unter Windows und Linux)
 *   └─ frontend/      (Angular-Build; entfällt mit --dev, dann kommt es vom Dev-Server)
 *
 * Weil alles gebündelt ist, braucht die fertige App keinen node_modules-Ordner.
 * Voraussetzung: Backend (`tsc`) und – ohne --dev – Frontend sind bereits gebaut.
 */
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const dev = process.argv.includes('--dev');
const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(desktopDir, 'app');
const frontendDist = path.resolve(desktopDir, '../frontend/dist/frontend/browser');
const backendDist = path.resolve(desktopDir, '../backend/dist/server.js');

if (!existsSync(backendDist)) {
  fail(
    `Backend ist nicht gebaut (${backendDist}). Bitte zuerst "npm run build -w @wortomat/backend" ausführen.`,
  );
}
if (!dev && !existsSync(path.join(frontendDist, 'index.html'))) {
  fail(
    `Frontend ist nicht gebaut (${frontendDist}). Bitte zuerst "npm run build -w @wortomat/frontend" ausführen.`,
  );
}

const pkg = JSON.parse(await readFile(path.join(desktopDir, 'package.json'), 'utf8'));

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

/**
 * NestJS lädt einige Pakete nur bei Bedarf (Microservices, WebSockets, Validierung …).
 * Wir nutzen sie nicht; als "external" markiert landen sie nicht im Bundle,
 * und Nest kommt mit ihrem Fehlen zurecht.
 */
const optionalNestPackages = [
  '@nestjs/microservices',
  '@nestjs/microservices/*',
  '@nestjs/websockets',
  '@nestjs/websockets/*',
  'class-transformer',
  'class-transformer/*',
  'class-validator',
];

const common = {
  bundle: true,
  platform: 'node',
  target: 'node24',
  sourcemap: dev ? 'inline' : false,
  keepNames: true,
  logLevel: 'warning',
  absWorkingDir: desktopDir,
};

await build({
  ...common,
  entryPoints: ['src/main.ts'],
  outfile: path.join(outDir, 'main.mjs'),
  format: 'esm',
  external: ['electron', ...optionalNestPackages],
  // Gebündelte CommonJS-Pakete (z. B. Express) rufen `require` auf.
  banner: {
    js: "import { createRequire as __wortomatCreateRequire } from 'node:module'; const require = __wortomatCreateRequire(import.meta.url);",
  },
});

await build({
  ...common,
  entryPoints: ['src/preload.ts'],
  outfile: path.join(outDir, 'preload.cjs'),
  format: 'cjs',
  external: ['electron'],
});

await cp(path.join(desktopDir, 'build/icon.png'), path.join(outDir, 'icon.png'));

if (!dev) {
  await cp(frontendDist, path.join(outDir, 'frontend'), { recursive: true });
}

await writeFile(
  path.join(outDir, 'package.json'),
  JSON.stringify(
    {
      name: 'wortomat',
      productName: pkg.productName,
      version: pkg.version,
      description: 'Software zum Schreiben von Büchern und Romanen',
      author: pkg.author ?? 'Wortomat',
      // Linux: verknüpft laufende Fenster mit dem Starter-Eintrag (WM_CLASS).
      desktopName: 'wortomat.desktop',
      main: 'main.mjs',
    },
    null,
    2,
  ) + '\n',
);

console.log(
  `Desktop-App gebündelt nach ${path.relative(process.cwd(), outDir) || '.'}${dev ? ' (Dev-Modus)' : ''}`,
);

function fail(message) {
  console.error(message);
  process.exit(1);
}
