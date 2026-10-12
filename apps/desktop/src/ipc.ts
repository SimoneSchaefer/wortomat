/** IPC-Kanäle zwischen Hauptprozess und Preload. Nur für native OS-Funktionen – Daten laufen über REST. */
export const IPC = {
  openProjectDialog: 'dialog:open-project',
  createProjectDialog: 'dialog:create-project',
  flushRequest: 'app:flush-request',
  flushDone: 'app:flush-done',
  exportDialog: 'dialog:export',
  openPath: 'shell:open-path',
  showItemInFolder: 'shell:show-item-in-folder',
  setLanguage: 'app:set-language',
  setTheme: 'app:set-theme',
} as const;
