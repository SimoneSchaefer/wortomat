import type {
  AnnotationKind,
  FontSize,
  NoteKind,
  QuoteStyle,
  SceneStatus,
  Theme,
} from '@wortomat/shared';

const numberFormat = new Intl.NumberFormat('de');

interface NoteKindTexts {
  /** Mehrzahl, z. B. Menüpunkt und Überschrift der Seitenleiste. */
  label: string;
  singular: string;
  newTitle: string;
  addLabel: string;
  /** Titel des „+“ an einer Gruppe in der Seitenleiste. */
  addToGroup: string;
  confirmDeleteGroup: (name: string) => string;
  emptyList: string;
  /** In der Auswahl einer Szene, wenn es noch keine Einträge gibt. */
  pickerEmpty: string;
  /** „… als neuen Charakter anlegen“ */
  create: (title: string) => string;
  summaryPlaceholder: string;
  textPlaceholder: string;
  /** Zwischenüberschriften für neue Einträge; leer = ohne Vorlage. */
  outline: string[];
}

/**
 * Texte der Oberfläche auf Deutsch – zugleich die Vorlage für alle anderen Sprachen
 * (`Texts`): Fehlt dort ein Text, meldet das der Compiler.
 */
export const de = {
  number: (value: number) => numberFormat.format(value),
  words: (count: number) => (count === 1 ? '1 Wort' : `${numberFormat.format(count)} Wörter`),
  keys: { ctrl: 'Strg', shift: 'Umschalt' },

  common: {
    back: '← Zurück',
    settings: 'Einstellungen',
    delete: 'Löschen',
    loading: 'Lade …',
    title: 'Titel',
  },

  errors: {
    backendUnreachable: 'Das Backend ist nicht erreichbar.',
    status: (status: number) => `Fehler ${status}`,
  },

  filePicker: {
    title: 'Buch öffnen',
    folderTitle: 'Speicherort wählen',
    chooseFolder: 'Diesen Ordner wählen',
    up: 'Übergeordneter Ordner',
    empty: 'Hier gibt es keine Ordner oder Wortomat-Dateien.',
    loadFailed: 'Der Ordner konnte nicht gelesen werden.',
    cancel: 'Abbrechen',
    open: 'Öffnen',
  },

  start: {
    tagline: 'Dein Buch. Deine Datei. Kein Server.',
    myBooks: 'Meine Bücher',
    openOtherFile: 'Andere Datei öffnen …',
    edited: (when: string) => `bearbeitet ${when}`,
    missing: 'Datei nicht gefunden – verschoben oder gelöscht?',
    forgetHint: 'Aus der Liste entfernen (die Datei bleibt erhalten)',
    forgetLabel: (title: string) => `${title} aus der Liste entfernen`,
    empty: 'Noch keine Bücher – leg unten dein erstes an.',
    listFailed: 'Die Liste konnte nicht geladen werden.',
    newBook: 'Neues Buch beginnen',
    titlePlaceholder: 'z. B. Die Häuser am Fluss',
    location: 'Speicherort',
    create: 'Anlegen',
    createWithDialog: 'Anlegen …',
    openOtherHeading: 'Andere Datei öffnen',
    path: 'Pfad zur .wortomat-Datei',
    browse: 'Durchsuchen …',
    open: 'Öffnen',
    version: (version: string) => `Version ${version}`,
    browserMode: 'Browser-Modus (Entwicklung)',
    defaultFileName: 'Neues Buch',
    titleRequired: 'Bitte gib deinem Buch einen Titel.',
    carousel: 'Bücher',
    previous: 'Vorheriges Buch',
    next: 'Nächstes Buch',
    forget: 'Aus der Liste entfernen',
    openBook: 'Öffnen',
  },

  workspace: {
    export: 'Exportieren …',
    closeProject: 'Projekt schließen',
    changeCover: 'Titelbild ändern',
    coverHint: 'Erscheint auf der Startseite und als Cover im E-Book.',
    sections: 'Bereiche',
    manuscript: 'Manuskript',
    sidebarWidth: 'Breite der Seitenleiste',
    resizeHint: 'Ziehen, um die Breite zu ändern – Doppelklick setzt sie zurück',
    chooseScene: 'Wähle links eine Szene aus – oder lege mit „+“ an einem Kapitel eine neue an.',
    chooseNote: (addLabel: string) =>
      `Wähle links einen Eintrag aus – oder lege mit „${addLabel}“ einen neuen an.`,
  },

  tree: {
    newTitle: {
      part: 'Neuer Teil',
      chapter: 'Neues Kapitel',
      scene: 'Neue Szene',
    } satisfies Record<'part' | 'chapter' | 'scene', string>,
    titleOf: (title: string) => `Titel von ${title}`,
    status: (status: string) => `Status: ${status}`,
    renameHint: (title: string) => `${title} (Doppelklick zum Umbenennen)`,
    collapse: 'Einklappen',
    expand: 'Ausklappen',
    addScene: 'Szene hinzufügen',
    addChapter: 'Kapitel hinzufügen',
    empty: 'Noch leer. Leg dein erstes Kapitel an.',
    addChapterButton: '+ Kapitel',
    addPartButton: '+ Teil',
    confirmDeleteScene: 'Möchtest du die Szene wirklich löschen?',
    confirmDeleteContainer: (title: string) =>
      `Möchtest du „${title}“ mit allen enthaltenen Szenen wirklich löschen?`,
  },

  filter: {
    toggle: 'Filter',
    hint: 'Szenen nach Status, offenen Markierungen, Charakteren, Orten oder Tags filtern',
    reset: 'Zurücksetzen',
    status: 'Status',
    annotations: 'Offen',
    rule: 'Innerhalb einer Zeile reicht eins davon, zwischen den Zeilen muss alles passen.',
    count: (shown: number, total: number) => `${shown} von ${total} Szenen`,
    noMatch: 'Keine Szene passt zum Filter.',
  },

  search: {
    label: 'Im ganzen Buch suchen',
    placeholder: 'Im ganzen Buch suchen …',
    clear: 'Suche leeren',
    results: 'Suchergebnisse',
    searching: 'Suche …',
    noHits: (query: string) => `Keine Treffer für „${query}“.`,
    scenes: 'Szenen',
  },

  noteKinds: {
    character: {
      label: 'Charaktere',
      singular: 'Charakter',
      newTitle: 'Neuer Charakter',
      addLabel: '+ Charakter',
      addToGroup: 'Charakter in dieser Gruppe anlegen',
      confirmDeleteGroup: (name: string) =>
        `Gruppe „${name}“ löschen? Die Charaktere darin bleiben erhalten.`,
      emptyList: 'Noch keine Charaktere.',
      pickerEmpty: 'Noch keine Charaktere – tippe einen Namen, um anzulegen.',
      create: (title: string) => `„${title}“ als neuen Charakter anlegen`,
      summaryPlaceholder: 'Kurzbeschreibung, z. B. „Protagonistin, 34, Ärztin in Hamburg“',
      textPlaceholder: 'Wer ist diese Figur?',
      outline: [
        'Äußeres',
        'Persönlichkeit',
        'Hintergrund',
        'Ziele & Motivation',
        'Rolle in der Geschichte',
      ],
    },
    place: {
      label: 'Orte',
      singular: 'Ort',
      newTitle: 'Neuer Ort',
      addLabel: '+ Ort',
      addToGroup: 'Ort in dieser Gruppe anlegen',
      confirmDeleteGroup: (name: string) =>
        `Gruppe „${name}“ löschen? Die Orte darin bleiben erhalten.`,
      emptyList: 'Noch keine Orte.',
      pickerEmpty: 'Noch keine Orte – tippe einen Namen, um anzulegen.',
      create: (title: string) => `„${title}“ als neuen Ort anlegen`,
      summaryPlaceholder: 'Kurzbeschreibung, z. B. „Alter Fischereihafen, Nordseeküste“',
      textPlaceholder: 'Wie sieht es hier aus?',
      outline: ['Beschreibung', 'Atmosphäre', 'Bedeutung für die Geschichte'],
    },
    research: {
      label: 'Forschung',
      singular: 'Recherche',
      newTitle: 'Neue Recherche',
      addLabel: '+ Recherche',
      addToGroup: 'Recherche in dieser Gruppe anlegen',
      confirmDeleteGroup: (name: string) =>
        `Gruppe „${name}“ löschen? Die Recherchen darin bleiben erhalten.`,
      emptyList: 'Noch keine Recherchen.',
      pickerEmpty: 'Noch keine Recherchen – tippe einen Titel, um anzulegen.',
      create: (title: string) => `„${title}“ als neue Recherche anlegen`,
      summaryPlaceholder: 'Worum geht es? z. B. „Gezeiten an der Nordsee“',
      textPlaceholder: 'Notizen, Zitate, Quellen …',
      outline: [],
    },
  } satisfies Record<NoteKind, NoteKindTexts>,

  notes: {
    confirmDelete: (title: string) => `„${title}“ wirklich löschen?`,
    notFound: 'Dieser Eintrag existiert nicht mehr.',
    summary: 'Kurzbeschreibung',
    group: 'Gruppe',
    ungrouped: 'Ohne Gruppe',
    addGroupButton: '+ Gruppe',
    newGroup: 'Neue Gruppe',
    groupName: (name: string) => `Name der Gruppe „${name}“`,
    emptyGroup: 'Leer – hierher ziehen',
    assignGroup: 'Gruppe zuweisen',
    changeGroup: 'Gruppe ändern',
    removeFromGroup: 'Aus der Gruppe nehmen',
    searchGroup: 'Gruppe suchen oder neu …',
    createGroup: (name: string) => `„${name}“ als neue Gruppe anlegen`,
    noGroups: 'Noch keine Gruppen – tippe einen Namen, um eine anzulegen.',
    noOtherGroups: 'Keine weiteren Gruppen – tippe einen Namen, um eine anzulegen.',
    profileImage: 'Profilbild',
    appearsIn: 'Kommt vor in',
    appearsNowhere: 'noch keiner Szene – verknüpfen lässt sich direkt in der Szene.',
  },

  gallery: {
    roleDescription: 'Bildergalerie',
    imageAlt: (label: string, position: number, count: number) =>
      `${label} ${position} von ${count}`,
    previous: 'Vorheriges Bild',
    next: 'Nächstes Bild',
    image: (position: number) => `Bild ${position}`,
    makeCover: (label: string) => `Als ${label}`,
    add: 'Bild hinzufügen',
    remove: 'Bild entfernen',
    uploading: 'Lade hoch …',
    addFirst: (label: string) => `${label} hinzufügen`,
    dropHint: 'oder Bilder hierher ziehen',
    confirmRemove: 'Dieses Bild entfernen?',
  },

  editor: {
    toolbar: 'Formatierung',
    bold: 'Fett',
    boldLetter: 'F',
    italic: 'Kursiv',
    italicLetter: 'K',
    underline: 'Unterstrichen',
    underlineLetter: 'U',
    strike: 'Durchgestrichen',
    strikeLetter: 'S',
    clearFormat: 'Formatierung entfernen',
    annotate: (label: string) => `Als ${label} markieren – nochmal klicken entfernt`,
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    placeholder: 'Es war einmal …',
    saveStatus: {
      loading: 'Lade …',
      saved: 'Gespeichert',
      unsaved: 'Ungespeichert',
      saving: 'Speichere …',
      error: 'Fehler',
    },
    imageFailed: (name: string, message: string) => `Bild „${name}“: ${message}`,
  },

  sceneStatus: {
    label: 'Status',
    names: {
      idea: 'Idee',
      outline: 'Struktur',
      draft: 'Entwurf',
      revised: 'Überarbeitet',
      final: 'Fertig',
    } satisfies Record<SceneStatus, string>,
  },

  annotations: {
    todo: { label: 'Todo', plural: 'Todos' },
    idea: { label: 'Idee', plural: 'Ideen' },
    fixme: { label: 'Fixme', plural: 'Fixmes' },
  } satisfies Record<AnnotationKind, { label: string; plural: string }>,

  sceneLinks: {
    tags: 'Tags',
    tag: 'Tag',
    remove: 'Aus dieser Szene entfernen',
    removeLabel: (title: string) => `${title} aus dieser Szene entfernen`,
    scrollLeft: 'Nach links scrollen',
    scrollLeftHint: 'Nach links – gedrückt halten zum Weiterscrollen',
    scrollRight: 'Nach rechts scrollen',
    scrollRightHint: 'Nach rechts – gedrückt halten zum Weiterscrollen',
    add: (singular: string) => `${singular} hinzufügen`,
    search: (singular: string) => `${singular} suchen oder neu …`,
    sceneCount: (count: number) => (count === 1 ? '1 Szene' : `${count} Szenen`),
    allTagsUsed: 'Alle Tags sind schon vergeben – tippe einen neuen.',
    noTags: 'Noch keine Tags – tippe einen, um ihn anzulegen.',
    allLinked: 'Alle sind schon verknüpft – tippe einen Namen, um neu anzulegen.',
    createTag: (name: string) => `„${name}“ als neuen Tag anlegen`,
  },

  export: {
    title: 'Manuskript exportieren',
    format: 'Format',
    formats: {
      html: { label: 'HTML', description: 'Eine Datei zum Lesen im Browser – mit Bildern.' },
      docx: {
        label: 'Word (.docx)',
        description: 'Zum Weiterbearbeiten oder Einreichen bei Verlag und Agentur.',
      },
      pdf: { label: 'PDF (pdfLaTeX)', description: 'Druckfertig gesetzt mit pdfLaTeX.' },
      epub: {
        label: 'E-Book (EPUB)',
        description: 'Für E-Reader wie Tolino oder Kobo, Apple Books und Calibre.',
      },
    },
    pdfMissing:
      'pdfLaTeX wurde auf diesem Rechner nicht gefunden. Mit TeX Live, MacTeX oder MiKTeX kannst du auch PDFs erzeugen.',
    pdfSearching: 'Suche pdfLaTeX …',
    template: 'Vorlage',
    templates: {
      normseite: {
        label: 'Normseite',
        description: '30 Zeilen à 60 Zeichen in Courier – der Standard für Verlage und Agenturen.',
      },
      roman: {
        label: 'Roman',
        description: 'Buchsatz 12,5 × 19 cm, Blocksatz mit Silbentrennung.',
      },
    },
    cover: 'Titelbild',
    noCover: 'Kein Titelbild',
    coverShown: 'Erscheint im Reader als Cover und in der Bibliothek.',
    coverMissing: 'Ohne Titelbild zeigen Reader das Buch als leere Kachel.',
    coverSize: 'Am besten im Hochformat, etwa 1600 × 2560 Pixel.',
    chooseImage: 'Bild wählen …',
    designCover: 'Aus Titel gestalten',
    otherColors: 'Andere Farben',
    removeCover: 'Entfernen',
    sceneTitles: 'Szenentitel als Zwischenüberschriften drucken',
    sceneTitlesHint: '(sonst stehen zwischen Szenen nur Trenner)',
    exported: 'Exportiert:',
    open: 'Öffnen',
    showInFolder: 'Im Ordner zeigen',
    downloaded: 'Heruntergeladen:',
    warnings: 'Hinweise',
    close: 'Schließen',
    exporting: 'Exportiere …',
    exportWithDialog: 'Exportieren …',
    download: 'Herunterladen',
    defaultName: 'Manuskript',
    unsupportedImage: 'Bitte ein Bild im Format JPEG, PNG, WebP, GIF oder AVIF wählen.',
  },

  settings: {
    title: 'Einstellungen',
    language: 'Sprache',
    languageHint: 'Sprache der Oberfläche. Dein Text und der Export bleiben davon unberührt.',
    theme: 'Farbschema',
    themes: {
      system: 'Wie das System',
      light: 'Hell',
      dark: 'Dunkel',
    } satisfies Record<Theme, string>,
    fontSize: 'Schriftgröße',
    fontSizeHint: 'Gilt für die ganze Oberfläche und den Text im Editor.',
    fontSizes: {
      small: 'Klein',
      medium: 'Mittel',
      large: 'Groß',
    } satisfies Record<FontSize, string>,
    quotes: 'Anführungszeichen',
    quotesHint:
      'Beim Schreiben werden " und \' automatisch durch diese Zeichen ersetzt. Die Rücktaste direkt danach macht die Ersetzung rückgängig. Bereits geschriebener Text bleibt unverändert.',
    quoteStyles: {
      de: 'Deutsch',
      'de-guillemets': 'Deutsch, Buchsatz',
      ch: 'Schweiz, Liechtenstein',
      en: 'Englisch',
      fr: 'Französisch',
      off: 'Nicht ersetzen',
    } satisfies Record<QuoteStyle, string>,
    /** Beispielsatz mit doppelten und einfachen Anführungszeichen und einem Apostroph. */
    quoteExample: (double: readonly string[], single: readonly string[], apostrophe: string) =>
      `${double[0]}Sag ${single[0]}bitte${single[1]}${double[1]}, flüstert${apostrophe}s.`,
  },
};

export type Texts = typeof de;
