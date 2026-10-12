/** IPC-Kanäle zwischen Hauptprozess und Preload. Nur für native OS-Funktionen – Daten laufen über REST. */
export const IPC = {
  openProjectDialog: 'dialog:open-project',
  createProjectDialog: 'dialog:create-project',
  flushRequest: 'app:flush-request',
  flushDone: 'app:flush-done',
} as const;
