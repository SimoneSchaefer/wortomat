/**
 * Läuft in einer Sandbox im Renderer und stellt `window.wortomat` bereit.
 * Bewusst minimal: nur Dinge, die eine Webseite nicht selbst kann.
 */
import type { DesktopBridge } from '@wortomat/shared';
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipc.js';

let beforeCloseHandler: (() => Promise<void>) | null = null;

// Der Hauptprozess fragt vor dem Schließen nach; ohne registrierten Handler antworten wir sofort.
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
};

contextBridge.exposeInMainWorld('wortomat', bridge);
