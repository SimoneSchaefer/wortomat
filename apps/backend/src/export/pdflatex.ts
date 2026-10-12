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
 * Sucht pdfLaTeX: erst im PATH, dann in den üblichen Installationsordnern. Desktop-Apps auf
 * macOS bekommen z. B. nicht den PATH der Shell – MacTeX liegt dann nicht im PATH.
 * Ein Fund wird gemerkt; ohne Fund wird beim nächsten Mal neu gesucht (vielleicht wurde
 * inzwischen TeX installiert).
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
      // nächster Kandidat
    }
  }
  return null;
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

/** Übersetzt das Dokument in einem temporären Ordner und liefert das PDF. */
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
        // -no-shell-escape: Text aus dem Buch kann niemals Programme starten.
        ['-interaction=nonstopmode', '-halt-on-error', '-no-shell-escape', 'manuskript.tex'],
        {
          cwd: dir,
          timeout: 180_000,
          windowsHide: true,
          maxBuffer: 20 * 1024 * 1024,
          // Hilfsprogramme (z. B. für Schriften) liegen neben pdflatex.
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

/** Macht aus dem LaTeX-Log eine verständliche Meldung. */
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
