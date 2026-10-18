/**
 * The release number. A commit on main gets one with its first release build, stored as a git tag
 * (`v2.0.7`); every later build of the same commit – on Linux, Windows or macOS – finds the tag and
 * uses the same number. Numbers count up without gaps, one per state of main that was ever built.
 *
 *   2.0.<n>                        the commit has the tag v2.0.<n>
 *   2.0.<next>-dev.g<hash>         anything else: a branch, or a commit without a release build yet
 *   2.0.<next>-dev.g<hash>.changed uncommitted changes on top
 *
 * `next` is the number the next release would get, so a dev build sorts just below it. Major and
 * minor come from apps/desktop/package.json; a new minor starts again at 1.
 *
 *   node version.mjs           prints the version (bundle.mjs uses appVersion() the same way)
 *   node version.mjs --assign  release build on CI: tags a commit on main that has no number yet
 *                              (unless a newer state of main has one already) and pushes the
 *                              tag, then prints the version
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIRST_NUMBER = 1;
const PUSH_ATTEMPTS = 5;

const desktopDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(desktopDir, 'package.json'), 'utf8'));
const [major, minor] = pkg.version.split('.');
const prefix = `v${major}.${minor}.`;

function git(...args) {
  return execFileSync('git', args, {
    cwd: desktopDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
}

/** Release numbers of this major.minor, from the tags. */
function numbers(pointsAt) {
  const args = ['tag', '--list', `${prefix}*`];
  if (pointsAt) args.push('--points-at', pointsAt);
  return git(...args)
    .split('\n')
    .map((tag) => tag.slice(prefix.length))
    .filter((n) => /^[1-9]\d*$/.test(n))
    .map(Number);
}

function nextNumber() {
  return Math.max(FIRST_NUMBER - 1, ...numbers()) + 1;
}

function isChanged() {
  return git('status', '--porcelain', '--untracked-files=no') !== '';
}

export function appVersion() {
  let head;
  try {
    head = git('rev-parse', 'HEAD');
  } catch {
    // Not a git checkout (e.g. a source archive): no way to tell the release
    return `${major}.${minor}.0-dev`;
  }
  const changed = isChanged();
  const own = numbers(head);
  if (own.length && !changed) return `${major}.${minor}.${Math.min(...own)}`;
  return `${major}.${minor}.${nextNumber()}-dev.g${head.slice(0, 7)}${changed ? '.changed' : ''}`;
}

/**
 * Only commits on main's first-parent line get a number – a feature commit that was merged is
 * reachable from main as well, but was never a state of main.
 */
function assign() {
  const head = git('rev-parse', 'HEAD');
  const onMain = git('rev-list', '--first-parent', 'origin/main').split('\n').includes(head);
  if (!onMain || isChanged()) return appVersion();
  for (let attempt = 0; attempt < PUSH_ATTEMPTS; attempt++) {
    if (numbers(head).length) return appVersion();
    // Numbers grow along main: an older state built after a newer one gets none
    if (hasNewerRelease(head)) return appVersion();
    const tag = `${prefix}${nextNumber()}`;
    git('tag', tag, head);
    try {
      git('push', 'origin', `refs/tags/${tag}`);
      return appVersion();
    } catch {
      // Another build was faster – with this commit (then its tag counts) or another one (then
      // the number is taken). Either way: drop ours and look again.
      git('tag', '--delete', tag);
      git('fetch', '--tags', '--force', 'origin');
    }
  }
  throw new Error(`Could not push a release tag for ${head}`);
}

function hasNewerRelease(head) {
  return numbers().some((n) => {
    const tagged = git('rev-list', '-n', '1', `${prefix}${n}`);
    try {
      git('merge-base', '--is-ancestor', head, tagged);
      return true;
    } catch {
      return false;
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(process.argv.includes('--assign') ? assign() : appVersion());
}
