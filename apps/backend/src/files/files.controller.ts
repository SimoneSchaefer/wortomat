import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { DirectoryEntry, DirectoryListing } from '@wortomat/shared';
import { SERVER_OPTIONS, type ServerOptions } from '../config.js';

const PROJECT_EXTENSION = '.wortomat';

/**
 * Folder browsing for the file picker in browser mode. A browser cannot provide real file paths, so
 * the local server reads the folders (the Electron app uses the native dialog instead). Only
 * folders and project files are listed.
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

/** If the folder does not exist (any more), the nearest existing one above it. */
function nearestDirectory(dir: string): string {
  let current = dir;
  for (;;) {
    try {
      if (statSync(current).isDirectory()) return current;
    } catch {
      // does not exist or no access – try one level up
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
    return []; // no read permission: show it empty, going up still works
  }
  const entries: DirectoryEntry[] = [];
  for (const name of names) {
    if (name.startsWith('.')) continue;
    const fullPath = path.join(dir, name);
    let isDirectory: boolean;
    try {
      isDirectory = statSync(fullPath).isDirectory(); // follows symlinks
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
