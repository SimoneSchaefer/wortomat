import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUTH_HEADER, type RunningServer, startServer } from '@wortomat/backend';
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  type IpcMainInvokeEvent,
  Menu,
  session,
  shell,
} from 'electron';
import { IPC } from './ipc.js';

const isDev = process.argv.includes('--dev');
/** Im Dev-Modus kommt das Frontend vom Angular-Dev-Server (mit Live-Reload). */
const DEV_FRONTEND_URL = 'http://localhost:4200';
/** Muss zu apps/frontend/proxy.conf.json passen. */
const DEV_BACKEND_PORT = 3000;
/** So lange warten wir beim Schließen höchstens auf das Speichern im Frontend. */
const FLUSH_TIMEOUT_MS = 5000;
const PROJECT_FILTERS = [{ name: 'Wortomat-Projekt', extensions: ['wortomat'] }];

const appDir = path.dirname(fileURLToPath(import.meta.url));
const token = randomBytes(32).toString('base64url');

let server: RunningServer | null = null;
let appUrl = '';
let mainWindow: BrowserWindow | null = null;
/** Projektdatei, mit der die App gestartet wurde (Doppelklick auf eine .wortomat-Datei). */
let pendingProjectPath = findProjectPath(process.argv);

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

  // macOS meldet geöffnete Dateien über ein Event statt über argv.
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    if (server) {
      void openProjectFromShell(filePath);
    } else {
      pendingProjectPath = filePath;
    }
  });

  app
    .whenReady()
    .then(start)
    .catch((error: unknown) => {
      dialog.showErrorBox('Wortomat konnte nicht gestartet werden', String(error));
      app.exit(1);
    });
}

async function start(): Promise<void> {
  server = await startServer({
    mode: 'desktop',
    version: app.getVersion(),
    defaultProjectDir: app.getPath('documents'),
    dataDir: app.getPath('userData'),
    port: isDev ? DEV_BACKEND_PORT : 0,
    token,
    staticDir: isDev ? undefined : path.join(appDir, 'frontend'),
    logger: isDev ? undefined : ['warn', 'error'],
  });
  appUrl = isDev ? DEV_FRONTEND_URL : server.url;

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
 * Hängt das Token an jede Anfrage an unser Backend an. Das Frontend kennt es
 * dadurch nicht und muss sich um nichts kümmern – auch `<img src>` funktioniert.
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
    webPreferences: {
      preload: path.join(appDir, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  window.once('ready-to-show', () => window.show());

  // Externe Links im Standardbrowser öffnen, nie im App-Fenster.
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
    const menu = Menu.buildFromTemplate([
      ...suggestions,
      ...(params.misspelledWord
        ? [
            {
              label: 'Zum Wörterbuch hinzufügen',
              click: () =>
                session.defaultSession.addWordToSpellCheckerDictionary(params.misspelledWord),
            },
            { type: 'separator' as const },
          ]
        : []),
      { role: 'cut', label: 'Ausschneiden', enabled: params.editFlags.canCut },
      { role: 'copy', label: 'Kopieren', enabled: params.editFlags.canCopy },
      { role: 'paste', label: 'Einfügen', enabled: params.editFlags.canPaste },
      { role: 'selectAll', label: 'Alles auswählen' },
    ]);
    menu.popup({ window });
  });

  closeAfterFlush(window);
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });

  void window.loadURL(appUrl);
  return window;
}

/** Vor dem Schließen gibt das Frontend noch ungespeicherte Änderungen ans Backend. */
function closeAfterFlush(window: BrowserWindow): void {
  let flushed = false;
  window.on('close', (event) => {
    // Beim Beenden der App wurde bereits in `shutdown()` gespeichert.
    if (flushed || quitReady) return;
    event.preventDefault();
    void flushRenderer(window).finally(() => {
      flushed = true;
      window.close();
    });
  });
}

function flushRenderer(window: BrowserWindow): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      ipcMain.removeListener(IPC.flushDone, onDone);
      resolve();
    };
    const onDone = (event: Electron.IpcMainEvent) => {
      if (event.sender === window.webContents) done();
    };
    const timer = setTimeout(done, FLUSH_TIMEOUT_MS);
    ipcMain.on(IPC.flushDone, onDone);
    window.webContents.send(IPC.flushRequest);
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
      title: 'Projekt öffnen',
      properties: ['openFile'],
      filters: PROJECT_FILTERS,
    });
    return result.canceled ? null : (result.filePaths[0] ?? null);
  });

  ipcMain.handle(IPC.createProjectDialog, async (event, suggestedName: unknown) => {
    const window = trustedWindow(event);
    const name = typeof suggestedName === 'string' ? sanitizeFileName(suggestedName) : '';
    const result = await dialog.showSaveDialog(window, {
      title: 'Neues Projekt anlegen',
      defaultPath: path.join(app.getPath('documents'), `${name || 'Neues Buch'}.wortomat`),
      filters: PROJECT_FILTERS,
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    });
    return result.canceled ? null : (result.filePath ?? null);
  });
}

/** IPC nur von unserer eigenen Seite akzeptieren. */
function trustedWindow(event: IpcMainInvokeEvent): BrowserWindow {
  const window = BrowserWindow.fromWebContents(event.sender);
  const frameUrl = event.senderFrame?.url;
  if (!window || !frameUrl || new URL(frameUrl).origin !== new URL(appUrl).origin) {
    throw new Error('IPC-Aufruf von unbekannter Herkunft abgelehnt.');
  }
  return window;
}

async function callBackend(urlPath: string, body: unknown): Promise<void> {
  if (!server) throw new Error('Backend läuft nicht.');
  const response = await fetch(server.url + urlPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [AUTH_HEADER]: token },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const { message } = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(message ?? `Fehler ${response.status}`);
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

// ---------------------------------------------------------------------------
// Beenden: erst Fenster (mit Speichern), dann Backend (schließt die Datenbank)
// ---------------------------------------------------------------------------

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (server && BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow();
  }
});

/** Wird gesetzt, sobald gespeichert und die Datenbank geschlossen ist. */
let quitReady = false;
let shutdownStarted = false;

// Strg+Q / Cmd+Q / letztes Fenster geschlossen: Electron feuert `before-quit`, bevor es
// die Fenster schließt. Wir halten das an, bis gespeichert und die Datenbank zu ist.
app.on('before-quit', (event) => {
  if (quitReady) return;
  event.preventDefault();
  if (!shutdownStarted) {
    shutdownStarted = true;
    void shutdown();
  }
});

async function shutdown(): Promise<void> {
  try {
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
