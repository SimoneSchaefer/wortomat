/**
 * Linux/GNOME on Wayland ignores Electron's window icon: the shell looks up a launcher entry for
 * the app ID ("wortomat", from `desktopName`) and takes its icon. Installed packages bring the
 * entry along; for `npm run dev:desktop` and `npm run start:desktop` this script creates it in
 * ~/.local/share/applications.
 *
 * A file name of its own, so a package installed later (wortomat.desktop) takes precedence.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(desktopDir, '../..');
const targetDir = path.join(
  process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local/share'),
  'applications',
);
const target = path.join(targetDir, 'wortomat-dev.desktop');

const entry = `[Desktop Entry]
Type=Application
Name=Wortomat (Entwicklung)
Exec="${path.join(repoDir, 'node_modules/.bin/electron')}" "${path.join(desktopDir, 'app')}" %f
Icon=${path.join(desktopDir, 'build/icon.png')}
StartupWMClass=wortomat
NoDisplay=true
`;

await mkdir(targetDir, { recursive: true });
await writeFile(target, entry);
console.log(`Starter-Eintrag angelegt: ${target}`);
