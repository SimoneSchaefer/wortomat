/**
 * The release number, derived from git alone so every build of the same commit on main gets the
 * same one – on Linux, Windows and macOS, however often and on whichever machine it is built:
 *
 *   2.0.<N>                      N = position of the commit on main (first parent only)
 *   2.0.<N>-dev.g<hash>          a commit that is not on main (a branch, or main not pushed yet)
 *   2.0.<N>-dev.g<hash>.changed  uncommitted changes on top
 *
 * Major and minor come from apps/desktop/package.json. Run directly, it prints the version.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function appVersion() {
  const pkg = JSON.parse(readFileSync(path.join(desktopDir, 'package.json'), 'utf8'));
  const [major, minor] = pkg.version.split('.');
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: desktopDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();

  let head;
  try {
    head = git('rev-parse', 'HEAD');
  } catch {
    // Not a git checkout (e.g. a source archive): no way to tell the release apart
    return `${major}.${minor}.0-dev`;
  }
  const count = git('rev-list', '--count', '--first-parent', 'HEAD');
  const version = `${major}.${minor}.${count}`;

  // A feature commit merged into main is reachable from it too, but not on its first-parent line –
  // its count could equal that of a real release.
  const onMain = mainLine().includes(head);
  const changed = git('status', '--porcelain', '--untracked-files=no') !== '';
  if (onMain && !changed) return version;
  return `${version}-dev.g${head.slice(0, 7)}${changed ? '.changed' : ''}`;

  function mainLine() {
    for (const ref of ['origin/main', 'main']) {
      try {
        return git('rev-list', '--first-parent', ref).split('\n');
      } catch {
        // try the next one
      }
    }
    return [];
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(appVersion());
}
