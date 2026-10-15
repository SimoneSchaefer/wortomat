import { execFile } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { LatexDocument } from './latex-renderer.js';
import { type Localized, LocalizedError, localized } from '../i18n.js';

const run = promisify(execFile);

export interface PdflatexInstallation {
  executable: string;
  version: string;
}

let found: PdflatexInstallation | null = null;

/**
 * Looks in PATH first, then in the usual install folders: desktop apps on macOS, for example, do
 * not get the shell's PATH, so MacTeX is not in it. A hit is remembered; a miss is searched again
 * next time (TeX may have been installed meanwhile).
 */
export async function findPdflatex(): Promise<PdflatexInstallation | null> {
  if (found) return found;
  for (const candidate of candidates()) {
    try {
      const { stdout } = await run(candidate, ['--version'], {
        timeout: 15_000,
        windowsHide: true,
      });
      found = { executable: candidate, version: stdout.split('\n')[0]!.trim() };
      return found;
    } catch {
      // not found or not runnable – try the next candidate
    }
  }
  return null;
}

/** Full path of a file in the TeX installation (e.g. a font), or `null`. */
export async function findTexFile(
  installation: PdflatexInstallation,
  name: string,
): Promise<string | null> {
  try {
    const { stdout } = await run(kpsewhichFor(installation), [name], {
      timeout: 15_000,
      windowsHide: true,
    });
    return stdout.split(/\r?\n/)[0]?.trim() || null;
  } catch {
    return null;
  }
}

function kpsewhichFor(installation: PdflatexInstallation): string {
  const exe = process.platform === 'win32' ? 'kpsewhich.exe' : 'kpsewhich';
  return path.isAbsolute(installation.executable)
    ? path.join(path.dirname(installation.executable), exe)
    : exe;
}

/** Asks kpsewhich next to pdflatex; without kpsewhich, no package counts as installed. */
export async function findLatexPackages(
  installation: PdflatexInstallation,
  packages: readonly string[],
): Promise<Set<string>> {
  const kpsewhich = kpsewhichFor(installation);
  let stdout = '';
  try {
    ({ stdout } = await run(
      kpsewhich,
      packages.map((name) => `${name}.sty`),
      { timeout: 15_000, windowsHide: true },
    ));
  } catch (error) {
    // If one of the packages is missing, kpsewhich exits with code 1 – the hits are still in
    // stdout.
    stdout = String((error as { stdout?: unknown }).stdout ?? '');
  }
  const found = new Set(
    stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => path.basename(file, '.sty')),
  );
  return new Set(packages.filter((name) => found.has(name)));
}

function candidates(): string[] {
  const exe = process.platform === 'win32' ? 'pdflatex.exe' : 'pdflatex';
  const list = [exe];
  const texlive = (root: string, arches: string[]) => {
    if (!existsSync(root)) return [];
    return readdirSync(root)
      .filter((entry) => /^\d{4}$/.test(entry))
      .sort()
      .reverse()
      .flatMap((year) => arches.map((arch) => path.join(root, year, 'bin', arch, exe)));
  };
  if (process.platform === 'darwin') {
    list.push(
      '/Library/TeX/texbin/pdflatex',
      '/opt/homebrew/bin/pdflatex',
      '/usr/local/bin/pdflatex',
      ...texlive('/usr/local/texlive', ['universal-darwin', 'x86_64-darwin', 'aarch64-darwin']),
    );
  } else if (process.platform === 'win32') {
    const local = process.env['LOCALAPPDATA'] ?? '';
    const programs = process.env['ProgramFiles'] ?? 'C:\\Program Files';
    list.push(
      path.join(local, 'Programs', 'MiKTeX', 'miktex', 'bin', 'x64', exe),
      path.join(programs, 'MiKTeX', 'miktex', 'bin', 'x64', exe),
      ...texlive('C:\\texlive', ['windows', 'win64', 'win32']),
    );
  } else {
    list.push(
      '/usr/bin/pdflatex',
      '/usr/local/bin/pdflatex',
      ...texlive('/usr/local/texlive', ['x86_64-linux', 'aarch64-linux']),
    );
  }
  return list.filter((candidate) => candidate === exe || existsSync(candidate));
}

/** Compiles in a temporary folder. */
export async function compilePdf(
  installation: PdflatexInstallation,
  document: LatexDocument,
): Promise<Buffer> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'wortomat-pdf-'));
  try {
    await writeFile(path.join(dir, 'manuskript.tex'), document.tex, 'utf8');
    for (const [name, data] of document.files) {
      await writeFile(path.join(dir, name), data);
    }
    const binDir = path.dirname(installation.executable);
    try {
      await run(
        installation.executable,
        // -no-shell-escape: text from the book can never start programs.
        ['-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', 'manuskript.tex'],
        {
          cwd: dir,
          timeout: 180_000,
          windowsHide: true,
          maxBuffer: 20 * 1024 * 1024,
          // Helper programs (e.g. for fonts) live next to pdflatex.
          env: { ...process.env, PATH: [binDir, process.env['PATH'] ?? ''].join(path.delimiter) },
        },
      );
    } catch {
      const log = await readFile(path.join(dir, 'manuskript.log'), 'utf8').catch(() => '');
      throw new LocalizedError(describeLatexError(log));
    }
    return await readFile(path.join(dir, 'manuskript.pdf'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export function describeLatexError(log: string): Localized {
  const missing = /! LaTeX Error: File `([^']+)' not found/.exec(log);
  if (missing) {
    return localized(
      `pdfLaTeX: Das Paket „${missing[1]}“ fehlt in deiner TeX-Installation. Bitte nachinstallieren (z. B. über den TeX-Live-Manager oder die MiKTeX-Konsole).`,
      `pdfLaTeX: The package “${missing[1]}” is missing from your TeX installation. Please install it (e.g. with the TeX Live Manager or the MiKTeX Console).`,
    );
  }
  const errorLine = log.split('\n').find((line) => line.startsWith('! '));
  return errorLine
    ? localized(
        `pdfLaTeX konnte das PDF nicht erzeugen: ${errorLine.slice(2).trim()}`,
        `pdfLaTeX could not create the PDF: ${errorLine.slice(2).trim()}`,
      )
    : localized(
        'pdfLaTeX konnte das PDF nicht erzeugen (keine Fehlermeldung im Protokoll).',
        'pdfLaTeX could not create the PDF (no error message in the log).',
      );
}
