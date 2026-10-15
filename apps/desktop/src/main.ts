import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUTH_HEADER, type RunningServer, startServer } from '@wortomat/backend';
import type { Language } from '@wortomat/shared';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  Menu,
  nativeTheme,
  session,
  shell,
} from 'electron';
import { IPC } from './ipc.js';
import { isLanguage, systemLanguage, TEXTS } from './texts.js';

const isDev = process.argv.includes('--dev');
/** In dev mode the frontend comes from the Angular dev server (with live reload). */
const DEV_FRONTEND_URL = 'http://localhost:4200';
/** Must match apps/frontend/proxy.conf.json. */
const DEV_BACKEND_PORT = 3000;
/** The longest we wait for the frontend to save when closing. */
const FLUSH_TIMEOUT_MS = 5000;

const appDir = path.dirname(fileURLToPath(import.meta.url));
const token = randomBytes(32).toString('base64url');

let server: RunningServer | null = null;
let appUrl = '';
let mainWindow: BrowserWindow | null = null;
/** Project file the app was started with (double-click on a .wortomat file). */
let pendingProjectPath = findProjectPath(process.argv);
let starting: Promise<void> | null = null;
/** Reported by the frontend; until then the system language. */
let language: Language | null = null;

/** Call only after `ready` (before that Electron does not know the system language). */
function currentLanguage(): Language {
  return language ?? systemLanguage(app.getPreferredSystemLanguages());
}

function texts() {
  return TEXTS[currentLanguage()];
}

function projectFilters() {
  return [{ name: texts().projectFile, extensions: ['wortomat'] }];
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = findProjectPath(argv);
    if (filePath) {
      void openProjectFromShell(filePath);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS reports opened files via an event instead of argv.
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (server) {
      void openProjectFromShell(filePath);
    } else {
      pendingProjectPath = filePath;
    }
  });

  starting = app
    .whenReady()
    .then(start)
    .catch((error: unknown) => {
      dialog.showErrorBox(texts().startFailed, String(error));
      app.exit(1);
    });
}

async function start(): Promise<void> {
  server = await startServer({
    mode: 'desktop',
    version: app.getVersion(),
    defaultProjectDir: app.getPath('documents'),
    dataDir: app.getPath('userData'),
    downloadsDir: app.getPath('downloads'),
    port: isDev ? DEV_BACKEND_PORT : 0,
    token,
    staticDir: isDev ? undefined : path.join(appDir, 'frontend'),
    logger: isDev ? undefined : ['warn', 'error'],
  });
  appUrl = isDev ? DEV_FRONTEND_URL : server.url;

  // Only development needs the default menu bar (File, Edit, View …). macOS keeps it: there it is
  // not attached to the window, and without it Cmd+C/V/Q do not work.
  if (!isDev && process.platform !== 'darwin') {
    Menu.setApplicationMenu(null);
  }

  injectAuthHeader([server.url, appUrl]);
  session.defaultSession.setSpellCheckerLanguages(['de-DE']);
  registerIpcHandlers();

  if (pendingProjectPath) {
    await callBackend('/api/project/open', { filePath: pendingProjectPath }).catch(showError);
    pendingProjectPath = null;
  }
  mainWindow = createMainWindow();
}

/**
 * The frontend therefore never knows it and has nothing to take care of – `<img src>` works too.
 */
function injectAuthHeader(origins: string[]): void {
  const allowed = new Set(origins.map((url) => new URL(url).origin));
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['http://127.0.0.1/*', 'http://localhost/*'] },
    (details, callback) => {
      if (allowed.has(new URL(details.url).origin)) {
        details.requestHeaders[AUTH_HEADER] = token;
      }
      callback({ requestHeaders: details.requestHeaders });
    },
  );
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 500,
    show: false,
    title: 'Wortomat',
    // macOS takes the icon from the app bundle, Windows and Linux need it on the window.
    icon: process.platform === 'darwin' ? undefined : path.join(appDir, 'icon.png'),
    webPreferences: {
      preload: path.join(appDir, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  // Open external links in the default browser, never in the app window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== new URL(appUrl).origin) {
      event.preventDefault();
      openExternal(url);
    }
  });

  window.webContents.on('context-menu', (_event, params) => {
    const suggestions = params.dictionarySuggestions.map((suggestion) => ({
      label: suggestion,
      click: () => window.webContents.replaceMisspelling(suggestion),
    }));
    const t = texts();
    const menu = Menu.buildFromTemplate([
      ...suggestions,
      ...(params.misspelledWord
        ? [
            {
              label: t.addToDictionary,
              click: () =>
                session.defaultSession.addWordToSpellCheckerDictionary(params.misspelledWord),
            },
            { type: 'separator' as const },
          ]
        : []),
      { role: 'cut', label: t.cut, enabled: params.editFlags.canCut },
      { role: 'copy', label: t.copy, enabled: params.editFlags.canCopy },
      { role: 'paste', label: t.paste, enabled: params.editFlags.canPaste },
      { role: 'selectAll', label: t.selectAll },
    ]);
    menu.popup({ window });
  });

  closeAfterFlush(window);
  // Windows: logging off/shutting down sends no signal but WM_ENDSESSION. We leave
  // `query-session-end` alone – logging off can still be cancelled then.
  window.on('session-end', () => app.quit());
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });

  void window.loadURL(appUrl);
  return window;
}

/** Before closing, the frontend hands unsaved changes to the backend. */
function closeAfterFlush(window: BrowserWindow): void {
  let flushed = false;
  window.on('close', (event) => {
    // When quitting the app, `shutdown()` has already saved.
    if (flushed || quitReady) return;
    event.preventDefault();
    void flushRenderer(window).finally(() => {
      flushed = true;
      window.close();
    });
  });
}

function flushRenderer(window: BrowserWindow): Promise<void> {
  const contents = window.webContents;
  // If the frontend is gone already (e.g. SIGTERM to all processes on logout), it cannot save
  // anything – then do not wait for the timeout needlessly.
  if (window.isDestroyed() || contents.isCrashed()) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      ipcMain.removeListener(IPC.flushDone, onDone);
      contents.removeListener('render-process-gone', done);
      resolve();
    };
    const onDone = (event: Electron.IpcMainEvent) => {
      if (event.sender === contents) done();
    };
    const timer = setTimeout(done, FLUSH_TIMEOUT_MS);
    ipcMain.on(IPC.flushDone, onDone);
    contents.once('render-process-gone', done);
    contents.send(IPC.flushRequest);
  });
}

async function openProjectFromShell(filePath: string): Promise<void> {
  if (mainWindow) {
    await flushRenderer(mainWindow);
  }
  try {
    await callBackend('/api/project/open', { filePath });
    mainWindow?.webContents.reload();
  } catch (error) {
    showError(error);
  }
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.openProjectDialog, async (event) => {
    const window = trustedWindow(event);
    const result = await dialog.showOpenDialog(window, {
      title: texts().openProject,
      properties: ['openFile'],
      filters: projectFilters(),
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.createProjectDialog, async (event, suggestedName: unknown) => {
    const window = trustedWindow(event);
    const name = typeof suggestedName === 'string' ? sanitizeFileName(suggestedName) : '';
    const result = await dialog.showSaveDialog(window, {
      title: texts().createProject,
      defaultPath: path.join(
        app.getPath('documents'),
        `${name || texts().defaultProjectName}.wortomat`,
      ),
      filters: projectFilters(),
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle(IPC.exportDialog, async (event, suggestedName: unknown, format: unknown) => {
    const window = trustedWindow(event);
    const target = EXPORT_FORMATS[format as keyof typeof EXPORT_FORMATS];
    if (!target) throw new Error(texts().unknownExportFormat);
    const name = typeof suggestedName === 'string' ? sanitizeFileName(suggestedName) : '';
    const result = await dialog.showSaveDialog(window, {
      title: texts().exportManuscript,
      defaultPath: path.join(
        app.getPath('documents'),
        `${name || texts().defaultExportName}.${target.extension}`,
      ),
      filters: [
        {
          name: texts().exportFormats[format as keyof typeof EXPORT_FORMATS],
          extensions: [target.extension],
        },
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });

  ipcMain.handle(IPC.openPath, async (event, filePath: unknown) => {
    trustedWindow(event);
    const message = await shell.openPath(requireExportedFile(filePath));
    if (message) throw new Error(message);
  });

  ipcMain.handle(IPC.showItemInFolder, (event, filePath: unknown) => {
    trustedWindow(event);
    shell.showItemInFolder(requireExportedFile(filePath));
  });

  ipcMain.on(IPC.setLanguage, (event, value: unknown) => {
    if (isTrusted(event) && isLanguage(value)) language = value;
  });

  // window frame, context menu and dialogs in the chosen colour scheme
  ipcMain.on(IPC.setTheme, (event, value: unknown) => {
    if (isTrusted(event) && (value === 'system' || value === 'light' || value === 'dark')) {
      nativeTheme.themeSource = value;
    }
  });
}

const EXPORT_FORMATS = {
  html: { extension: 'html' },
  docx: { extension: 'docx' },
  pdf: { extension: 'pdf' },
  epub: { extension: 'epub' },
} as const;

/**
 * Only open exported files: existing .html/.docx/.pdf/.epub. That way even a compromised page
 * cannot start programs through this path (on Windows, opening an .exe would run it).
 */
function requireExportedFile(filePath: unknown): string {
  if (
    typeof filePath !== 'string' ||
    !path.isAbsolute(filePath) ||
    !/\.(html|docx|pdf|epub)$/i.test(filePath) ||
    !existsSync(filePath)
  ) {
    throw new Error(texts().cannotOpenFile);
  }
  return filePath;
}

function trustedWindow(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (!window || !isTrusted(event)) {
    throw new Error('IPC-Aufruf von unbekannter Herkunft abgelehnt.');
  }
  return window;
}

function isTrusted(event: IpcMainInvokeEvent | IpcMainEvent): boolean {
  const frameUrl = event.senderFrame?.url;
  return !!frameUrl && new URL(frameUrl).origin === new URL(appUrl).origin;
}

async function callBackend(urlPath: string, body: unknown): Promise<void> {
  if (!server) throw new Error(texts().backendNotRunning);
  const response = await fetch(server.url + urlPath, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': currentLanguage(),
      [AUTH_HEADER]: token,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const { message } = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(message ?? texts().status(response.status));
  }
}

function findProjectPath(argv: readonly string[]): string | null {
  return (
    argv.slice(1).find((arg) => !arg.startsWith('-') && arg.toLowerCase().endsWith('.wortomat')) ??
    null
  );
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .slice(0, 120);
}

function openExternal(url: string): void {
  if (/^https?:\/\//i.test(url)) {
    void shell.openExternal(url);
  }
}

function showError(error: unknown): void {
  dialog.showErrorBox('Wortomat', error instanceof Error ? error.message : String(error));
}

// Quitting: windows first (with saving), then the backend (closes the database)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (server && BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

/** Set once everything is saved and the database is closed. */
let quitReady = false;
let shutdownStarted = false;

// Ctrl+Q / Cmd+Q / last window closed: Electron fires `before-quit` before closing the windows. We
// hold that until everything is saved and the database is closed.
app.on('before-quit', (event) => {
  if (quitReady) return;
  event.preventDefault();
  if (!shutdownStarted) {
    shutdownStarted = true;
    void shutdown();
  }
});

// SIGTERM (kill, logout/shutdown on Linux, systemd) and SIGINT (Ctrl+C in the terminal) explicitly
// go through the normal quit above. A second signal during quitting aborts hard in case saving
// hangs.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    if (shutdownStarted || !app.isReady()) {
      app.exit(128 + os.constants.signals[signal]);
      return;
    }
    app.quit();
  });
}

async function shutdown(): Promise<void> {
  try {
    // If quitting arrives in the middle of starting, finish starting first – otherwise the backend
    // would stay open.
    await starting;
    await Promise.all(BrowserWindow.getAllWindows().map((window) => flushRenderer(window)));
    await server?.close();
  } catch (error) {
    console.error('Fehler beim Beenden', error);
  } finally {
    server = null;
    quitReady = true;
    app.quit();
  }
}
