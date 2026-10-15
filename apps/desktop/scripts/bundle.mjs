/**
 * Builds the contents of `apps/desktop/app/` – exactly what electron-builder packs:
 *
 *   app/
 *   ├─ package.json   (without dependencies)
 *   ├─ main.mjs       (Electron main process + the complete NestJS backend in one file)
 *   ├─ preload.cjs
 *   ├─ icon.png       (window icon on Windows and Linux)
 *   └─ frontend/      (Angular build; omitted with --dev, then it comes from the dev server)
 *
 * Because everything is bundled, the packaged app needs no node_modules folder. Requires the
 * backend (`tsc`) and – without --dev – the frontend to be built already.
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
 * NestJS loads some packages only on demand (microservices, websockets, validation …). We do not
 * use them; marked as external they stay out of the bundle, and Nest copes with them missing.
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
  // Bundled CommonJS packages (e.g. Express) call `require`.
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
      // The .deb package needs a homepage and a maintainer (name with email).
      homepage: pkg.homepage,
      author: pkg.author,
      // Linux: links running windows to the launcher entry (WM_CLASS).
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
