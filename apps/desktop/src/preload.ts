/**
 * Runs sandboxed in the renderer and provides `window.wortomat`. Deliberately minimal: only things
 * a web page cannot do itself.
 */
import type { DesktopBridge } from '@wortomat/shared';
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipc.js';

let beforeCloseHandler: (() => Promise<void>) | null = null;

// The main process asks before closing; without a registered handler we answer right away.
ipcRenderer.on(IPC.flushRequest, () => {
  const handler = beforeCloseHandler ?? (() => Promise.resolve());
  handler()
    .catch((error: unknown) => console.error('Speichern vor dem Schließen fehlgeschlagen', error))
    .finally(() => ipcRenderer.send(IPC.flushDone));
});

const bridge: DesktopBridge = {
  isDesktop: true,
  showOpenProjectDialog: () => ipcRenderer.invoke(IPC.openProjectDialog),
  showCreateProjectDialog: (suggestedName) =>
    ipcRenderer.invoke(IPC.createProjectDialog, suggestedName),
  onBeforeClose: (handler) => {
    beforeCloseHandler = handler;
  },
  showExportDialog: (suggestedName, format) =>
    ipcRenderer.invoke(IPC.exportDialog, suggestedName, format),
  openPath: (filePath) => ipcRenderer.invoke(IPC.openPath, filePath),
  showItemInFolder: (filePath) => ipcRenderer.invoke(IPC.showItemInFolder, filePath),
  setLanguage: (language) => ipcRenderer.send(IPC.setLanguage, language),
  setTheme: (theme) => ipcRenderer.send(IPC.setTheme, theme),
};

contextBridge.exposeInMainWorld('wortomat', bridge);
