import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { DirectoryEntry, DirectoryListing } from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';

const PROJECT_EXTENSION = '.wortomat';

/**
 * Ordner durchsuchen für den Dateiauswahl-Dialog im Browser-Modus. Ein Browser kann keine
 * echten Dateipfade liefern, daher liest der lokale Server die Ordner (die Electron-App
 * nutzt stattdessen den nativen Dialog). Gezeigt werden nur Ordner und Projektdateien.
 */
@Controller('files')
export class FilesController {
  constructor(@Inject(SERVER_OPTIONS) private readonly options: ServerOptions) {}

  @Get()
  list(@Query('dir') dir: unknown): DirectoryListing {
    const start = typeof dir === 'string' && dir.trim() ? dir : this.options.defaultProjectDir;
    const current = nearestDirectory(path.resolve(start));
    const parent = path.dirname(current);
    return {
      path: current,
      parent: parent === current ? null : parent,
      entries: readEntries(current),
    };
  }
}

/** Gibt es den Ordner nicht (mehr), dann den nächsten vorhandenen darüber. */
function nearestDirectory(dir: string): string {
  let current = dir;
  for (;;) {
    try {
      if (statSync(current).isDirectory()) return current;
    } catch {
      // existiert nicht oder kein Zugriff – eine Ebene höher versuchen
    }
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
}

function readEntries(dir: string): DirectoryEntry[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return []; // kein Leserecht: leer anzeigen, nach oben geht es trotzdem
  }
  const entries: DirectoryEntry[] = [];
  for (const name of names) {
    if (name.startsWith('.')) continue;
    const fullPath = path.join(dir, name);
    let isDirectory: boolean;
    try {
      isDirectory = statSync(fullPath).isDirectory(); // folgt Verknüpfungen
    } catch {
      continue;
    }
    if (isDirectory) {
      entries.push({ name, path: fullPath, kind: 'directory' });
    } else if (name.toLowerCase().endsWith(PROJECT_EXTENSION)) {
      entries.push({ name, path: fullPath, kind: 'project' });
    }
  }
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  return entries.sort(
    (a, b) =>
      Number(a.kind === 'project') - Number(b.kind === 'project') ||
      collator.compare(a.name, b.name),
  );
}
