import type { ExportFormat, Language } from '@wortomat/shared';

/** In the language the frontend reports. */
export const TEXTS = {
  de: {
    startFailed: 'Wortomat konnte nicht gestartet werden',
    projectFile: 'Wortomat-Projekt',
    addToDictionary: 'Zum Wörterbuch hinzufügen',
    cut: 'Ausschneiden',
    copy: 'Kopieren',
    paste: 'Einfügen',
    selectAll: 'Alles auswählen',
    openProject: 'Projekt öffnen',
    createProject: 'Neues Projekt anlegen',
    defaultProjectName: 'Neues Buch',
    exportManuscript: 'Manuskript exportieren',
    defaultExportName: 'Manuskript',
    exportFormats: {
      html: 'Webseite (HTML)',
      docx: 'Word-Dokument',
      pdf: 'PDF-Dokument',
      epub: 'E-Book (EPUB)',
    } satisfies Record<ExportFormat, string>,
    unknownExportFormat: 'Unbekanntes Exportformat.',
    cannotOpenFile: 'Diese Datei kann nicht geöffnet werden.',
    backendNotRunning: 'Backend läuft nicht.',
    status: (status: number) => `Fehler ${status}`,
  },
  en: {
    startFailed: 'Wortomat could not be started',
    projectFile: 'Wortomat project',
    addToDictionary: 'Add to dictionary',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select all',
    openProject: 'Open project',
    createProject: 'Create new project',
    defaultProjectName: 'New book',
    exportManuscript: 'Export manuscript',
    defaultExportName: 'Manuscript',
    exportFormats: {
      html: 'Web page (HTML)',
      docx: 'Word document',
      pdf: 'PDF document',
      epub: 'E-book (EPUB)',
    },
    unknownExportFormat: 'Unknown export format.',
    cannotOpenFile: 'This file cannot be opened.',
    backendNotRunning: 'The backend is not running.',
    status: (status: number) => `Error ${status}`,
  },
} satisfies Record<Language, unknown>;

/** As in the frontend: German if the system speaks German, otherwise English. */
export function systemLanguage(languages: readonly string[]): Language {
  const preferred = languages.find((tag) => /^(de|en)\b/i.test(tag));
  return preferred?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function isLanguage(value: unknown): value is Language {
  return value === 'de' || value === 'en';
}
