/**
 * Linux/GNOME unter Wayland: Das Fenster-Icon von Electron wird ignoriert, die Shell
 * sucht zur App-ID ("wortomat", aus `desktopName`) einen Starter-Eintrag und nimmt dessen Icon.
 * Installierte Pakete bringen den Eintrag mit; für `npm run dev:desktop` und
 * `npm run start:desktop` legt dieses Skript ihn unter ~/.local/share/applications an.
 *
 * Eigener Dateiname, damit ein später installiertes Paket (wortomat.desktop) Vorrang hat.
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
