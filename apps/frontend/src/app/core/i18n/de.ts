import type {
  AnnotationKind,
  FontSize,
  NoteKind,
  QuoteStyle,
  SceneStatus,
  Theme,
} from '@wortomat/shared';

const numberFormat = new Intl.NumberFormat('de');
const decimalFormat = new Intl.NumberFormat('de', { maximumFractionDigits: 1 });

interface NoteKindTexts {
  /** Plural, e.g. menu item and sidebar heading. */
  label: string;
  singular: string;
  newTitle: string;
  addLabel: string;
  /** Title of the "+" on a group in the sidebar. */
  addToGroup: string;
  deleteGroupMessage: (name: string) => string;
  emptyList: string;
  /** In a scene's picker when there are no entries yet. */
  pickerEmpty: string;
  /** "… create as new character" */
  create: (title: string) => string;
  summaryPlaceholder: string;
  textPlaceholder: string;
  /** Subheadings for new entries; empty = no template. */
  outline: string[];
}

/**
 * German UI texts – also the template for every other language (`Texts`): if a text is missing
 * there, the compiler reports it.
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
    unexpected: (message: string) => `Unerwarteter Fehler: ${message}`,
  },

  confirm: {
    cancel: 'Abbrechen',
    delete: 'Löschen',
    remove: 'Entfernen',
    irreversible: 'Das lässt sich nicht rückgängig machen.',
  },

  status: {
    dismiss: 'Meldung schließen',
    dismissAll: 'Alle schließen',
    times: (count: number) => `${count}×`,
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
    export: 'Exportieren',
    proofreading: 'Korrektur unterwegs',
    newProofNotes: (count: number) =>
      count === 1 ? '1 neue Notiz vom Handy' : `${count} neue Notizen vom Handy`,
    closeProject: 'Projekt schließen',
    moreActions: 'Menü',
    showList: 'Liste zum Auswählen öffnen',
    changeCover: 'Titel, Autor und Titelbild',
    coverHint: 'Erscheint auf der Startseite und als Cover im E-Book.',
    sections: 'Bereiche',
    manuscript: 'Manuskript',
    sidebarWidth: 'Breite der Seitenleiste',
    resizeHint: 'Ziehen, um die Breite zu ändern – Doppelklick setzt sie zurück',
    chooseScene:
      'Wähle in der Liste eine Szene aus – oder lege mit „+“ an einem Kapitel eine neue an.',
    chooseNote: (addLabel: string) =>
      `Wähle in der Liste einen Eintrag aus – oder lege mit „${addLabel}“ einen neuen an.`,
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
    deleteTitle: { part: 'Teil löschen?', chapter: 'Kapitel löschen?', scene: 'Szene löschen?' },
    deleteScene: (title: string) => `„${title}“ wird mit ihrem ganzen Text gelöscht.`,
    deleteContainer: (title: string) => `„${title}“ wird mit allen enthaltenen Szenen gelöscht.`,
  },

  filter: {
    toggle: 'Filter',
    hint: 'Szenen nach Status, offenen Markierungen, Strängen, Charakteren, Orten oder Tags filtern',
    reset: 'Zurücksetzen',
    status: 'Status',
    annotations: 'Offen',
    turningPoints: 'Nur Wendepunkte',
    rule: 'Innerhalb einer Zeile reicht eins davon, zwischen den Zeilen muss alles passen.',
    count: (shown: number, total: number) => `${shown} von ${total} Szenen`,
    noMatch: 'Keine Szene passt zum Filter.',
  },

  search: {
    label: 'Im ganzen Buch suchen',
    placeholder: 'Im ganzen Buch suchen',
    shortPlaceholder: 'Suchen',
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
      deleteGroupMessage: (name: string) =>
        `Die Gruppe „${name}“ wird gelöscht. Die Charaktere darin bleiben erhalten.`,
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
      deleteGroupMessage: (name: string) =>
        `Die Gruppe „${name}“ wird gelöscht. Die Orte darin bleiben erhalten.`,
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
      deleteGroupMessage: (name: string) =>
        `Die Gruppe „${name}“ wird gelöscht. Die Recherchen darin bleiben erhalten.`,
      emptyList: 'Noch keine Recherchen.',
      pickerEmpty: 'Noch keine Recherchen – tippe einen Titel, um anzulegen.',
      create: (title: string) => `„${title}“ als neue Recherche anlegen`,
      summaryPlaceholder: 'Worum geht es? z. B. „Gezeiten an der Nordsee“',
      textPlaceholder: 'Notizen, Zitate, Quellen …',
      outline: [],
    },
  } satisfies Record<NoteKind, NoteKindTexts>,

  notes: {
    deleteTitle: (singular: string) => `${singular} löschen?`,
    deleteMessage: (title: string) => `„${title}“ wird mit allen Angaben gelöscht.`,
    deleteGroupTitle: 'Gruppe löschen?',
    deleteLabel: (title: string) => `${title} löschen`,
    deleteGroupLabel: (name: string) => `Gruppe ${name} löschen`,
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

  maps: {
    label: 'Karten',
    kind: 'Karte',
    name: 'Name der Karte',
    newName: 'Neue Karte',
    add: 'Neue Karte zeichnen',
    addFirst: '+ Karte zeichnen',
    deleteTitle: 'Karte löschen?',
    deleteMessage: (name: string) =>
      `„${name}“ wird mit der Zeichnung gelöscht. Die Orte selbst bleiben erhalten.`,
    notFound: 'Diese Karte existiert nicht mehr.',
    toolbar: 'Zeichenwerkzeuge',
    toolLabel: 'Werkzeug',
    pen: 'Stift',
    area: 'Fläche',
    eraser: 'Radierer',
    hand: 'Verschieben',
    zoom: 'Lupe',
    zoomLabel: 'Zoom',
    zoomIn: 'Vergrößern',
    zoomOut: 'Verkleinern',
    zoomFit: 'Ganze Karte zeigen',
    zoomHint:
      'Zoomen auch mit Strg + Mausrad oder zwei Fingern am Trackpad; verschieben mit gedrückter Leertaste oder mittlerer Maustaste',
    colorLabel: 'Farbe',
    colors: {
      ink: 'Tinte',
      water: 'Wasser',
      forest: 'Wald & Wiese',
      earth: 'Berge & Erde',
      road: 'Wege & Grenzen',
      sand: 'Sand & Felder',
    },
    widthLabel: 'Strichstärke',
    widths: ['Fein', 'Mittel', 'Breit'],
    undo: 'Rückgängig',
    redo: 'Wiederholen',
    addBackground: 'Bild als Vorlage …',
    replaceBackground: 'Bild ersetzen …',
    backgroundHint: 'z. B. eine abfotografierte Skizze, die du nachzeichnen oder ergänzen kannst',
    removeBackground: 'Bild entfernen',
    backgroundOpacity: 'Deckkraft des Bilds',
    unsupportedImage: 'Dieses Bildformat wird nicht unterstützt (JPEG, PNG, WebP, GIF, AVIF).',
    canvasLabel: (name: string) => `Karte „${name}“`,
    emptyHint:
      'Zeichne Küsten, Flüsse und Straßen mit dem Stift, Seen und Wälder als Fläche – und setze dann deine Orte.',
    offMap: 'Noch nicht eingezeichnet',
    onMap: 'Auf der Karte',
    placeHint: 'Anklicken und auf die Karte klicken – oder hinüberziehen.',
    allPlaced: 'Alle Orte sind eingezeichnet.',
    noPlaces: 'Noch keine Orte – lege sie mit „+ Ort“ an.',
    placing: (title: string) => `Klicke auf die Karte, um „${title}“ einzuzeichnen. Esc bricht ab.`,
    openPlace: 'Ort öffnen',
    removePin: 'Von der Karte nehmen',
    location: 'Lage',
    showOnMap: (name: string) => `Auf der Karte „${name}“ zeigen`,
    notOnMap: 'Noch auf keiner Karte eingezeichnet – einzeichnen auf',
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
    removeTitle: 'Bild entfernen?',
    removeMessage: 'Das Bild wird aus der Galerie entfernt.',
    crop: 'Zuschneiden',
    cropTitle: 'Bild zuschneiden',
    cropHint:
      'Rahmen verschieben oder an den Ecken größer und kleiner ziehen. Tastatur: Pfeiltasten, + und −. Das Original bleibt erhalten.',
    cropFrame: 'Ausschnitt',
    cropReset: 'Ganzes Bild',
    cropApply: 'Übernehmen',
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
    writtenToday: (count: number) =>
      `Heute: ${count === 1 ? '1 Wort' : `${numberFormat.format(count)} Wörter`} geschrieben`,
    writtenTodayHint:
      'Selbst getippte Wörter in allen Szenen seit 4 Uhr – Überarbeiten zählt mit, Eingefügtes nicht',
    noNote: 'Keine Notiz',
    addNote: '+ Notiz',
    editNote: 'Notiz bearbeiten',
    notePlaceholder: 'Notiz zu dieser Stelle …',
    noteSave: 'Fertig',
    markCount: (count: number) => (count === 1 ? '1 Markierung' : `${count} Markierungen`),
    jumpToNote: 'Zur Stelle springen',
    quote: (text: string) => `„${text}“`,
    proofReplace: (from: string, to: string) => `„${to}“ statt „${from}“`,
    proofDelete: (from: string) => `„${from}“ streichen`,
    proofAccept: 'Übernehmen',
    proofReject: 'Verwerfen',
    proofDone: 'Erledigt',
  },

  proofreading: {
    title: 'Korrektur unterwegs',
    intro:
      'Lies dein Manuskript auf dem Android-Handy Korrektur – offline, mit Notizen und Ersetzungsvorschlägen. Zurück am Rechner holst du die Notizen hier ins Buch.',
    exportTitle: 'Korrekturfassung fürs Handy erstellen',
    exportHint:
      'Eine einzige HTML-Datei mit deinem Manuskript. Schick sie dir aufs Android-Handy (GSConnect, Mail, Messenger, USB), speichere sie und öffne sie in Chrome – sie läuft offline. Öffne sie danach immer auf demselben Weg, dann merkt sie sich deine Notizen.',
    create: 'Korrekturfassung erstellen …',
    creating: 'Erstelle …',
    defaultName: 'Korrekturfassung',
    savedTo: (path: string) => `Gespeichert: ${path}`,
    downloadedAs: (name: string) => `Heruntergeladen: ${name}`,
    showInFolder: 'Im Ordner zeigen',
    phoneSteps:
      'Auf dem Handy: Text markieren → „Notiz“ oder „Vorschlag“. Zum Schluss „Notizen senden“ und die Datei hier unten übernehmen.',
    importTitle: 'Notizen vom Handy übernehmen',
    importHint:
      'Jede Notiz wird zu einer Fixme-Markierung an ihrer Textstelle; Vorschläge übernimmst oder verwirfst du dort mit einem Klick. Liegt die Notizdatei nicht im Download-Ordner, wähle sie selbst aus.',
    choose: 'Andere Notizdatei auswählen …',
    importInbox: 'Übernehmen',
    inboxFrom: (name: string, when: string) => `aus „${name}“, ${when}`,
    inboxEmpty: (dir: string) => `Keine neuen Notizen in ${dir}.`,
    clean: (count: number) =>
      count === 1 ? 'Erledigte Notizdatei löschen …' : `${count} erledigte Notizdateien löschen …`,
    cleanTitle: 'Notizdateien löschen?',
    cleanMessage: (count: number, dir: string) =>
      `${count === 1 ? 'Die Notizdatei' : `${count} Notizdateien`} in ${dir} ${count === 1 ? 'wird' : 'werden'} gelöscht. Alle Notizen daraus stehen schon im Buch.`,
    cleaned: (count: number) =>
      count === 1 ? '1 Notizdatei gelöscht.' : `${count} Notizdateien gelöscht.`,
    importing: 'Übernehme Notizen …',
    applied: (count: number) =>
      count === 1 ? '1 Notiz übernommen.' : `${count} Notizen übernommen.`,
    appliedHint: 'Du findest sie als Fixme-Markierungen – im Baum, im Szenenfilter und im Text.',
    skipped: (count: number) =>
      count === 1
        ? '1 Notiz war schon von einem früheren Import da.'
        : `${count} Notizen waren schon von einem früheren Import da.`,
    unmatchedTitle: (count: number) =>
      count === 1
        ? '1 Notiz ließ sich nicht zuordnen'
        : `${count} Notizen ließen sich nicht zuordnen`,
    unmatchedHint:
      'Diese Stellen stehen so nicht mehr im Text – vielleicht hast du sie inzwischen geändert. Bitte von Hand nachsehen.',
    sceneGone: 'Szene gibt es nicht mehr',
    quote: (text: string) => `„${text}“`,
    openScene: 'Szene öffnen',
    suggestion: (text: string) => (text ? `Vorschlag: „${text}“` : 'Vorschlag: streichen'),
    unreadable: 'Die Datei ist keine lesbare Notizdatei.',
  },

  plot: {
    title: 'Handlung',
    intro:
      'Jeder Strang eine Linie, von links nach rechts. Wo Stränge zusammenlaufen, teilen sie sich eine Szene.',
    orderBy: 'Ordnen nach',
    storyOrder: 'Handlung',
    bookOrder: 'Buch',
    storyHint:
      'Ziehe Szenen an die Stelle, an der sie passieren – auf eine andere Szene gezogen passieren sie gleichzeitig. Über den Spalten beginnst du mit „+“ einen Abschnitt wie „Tag 2“.',
    bookHint: 'Die Szenen in der Reihenfolge des Buchs, nach Kapiteln.',
    bookPosition: (number: number) => `im Buch Szene ${number}`,
    displaced: 'versetzt',
    displacedHint:
      'Steht im Buch an anderer Stelle als in der Handlung – z. B. eine Rückblende. Gewollt? Sonst ein Hinweis auf einen Zeitfehler.',
    simultaneous: (count: number) =>
      `gleichzeitig mit ${count === 1 ? '1 Szene' : `${count} Szenen`}`,
    addMark: 'Hier einen Abschnitt beginnen (z. B. „Tag 2“)',
    markPlaceholder: 'z. B. Tag 2',
    markLabel: 'Name des Abschnitts',
    editMark: (label: string) => `Abschnitt „${label}“ umbenennen`,
    deleteMark: 'Abschnitt entfernen',
    moveHint: 'Alt + Pfeiltasten verschieben die Szene in der Handlung',
    reset: 'Auf Buchreihenfolge zurücksetzen …',
    resetTitle: 'Reihenfolge zurücksetzen?',
    resetMessage:
      'Alle Szenen stehen danach wieder in der Reihenfolge des Buchs, und die Abschnitte werden entfernt.',
    resetConfirm: 'Zurücksetzen',
    titles: 'Szenentitel',
    titlesHint: 'Titel unter den Szenen zeigen – ohne Titel wird die Übersicht viel schmaler',
    moveLaneHint: 'Ziehen oder Alt + Pfeil hoch/runter ändert die Reihenfolge der Stränge',
    show: 'Anzeigen',
    turningPoints: 'Wendepunkte',
    allScenes: 'Alle Szenen',
    noStrand: 'Ohne Strang',
    chapter: (number: number) => `Kapitel ${number}`,
    hoverHint: 'Zeige auf eine Szene, um sie hier zu sehen – ein Klick öffnet sie.',
    noScenes: 'Noch keine Szenen im Buch.',
    noStrands:
      'Noch keine Stränge. Ordne Szenen in den Szenendetails einem Strang zu (Zeile „Stränge“) – dann laufen sie hier als Linien durchs Buch.',
    noTurningPoints:
      'Noch keine Wendepunkte. Markiere wichtige Szenen in den Szenendetails als „Wendepunkt“ – oder zeige alle Szenen.',
    showAll: 'Alle Szenen zeigen',
    sceneCount: (count: number) => (count === 1 ? '1 Szene' : `${count} Szenen`),
    openScene: (title: string) => `Szene „${title}“ öffnen`,
  },

  stats: {
    title: 'Statistik',
    scenes: (count: number) => (count === 1 ? '1 Szene' : `${numberFormat.format(count)} Szenen`),
    totalWords: 'Wörter',
    totalScenes: 'Szenen',
    pages: 'Normseiten',
    pagesValue: (count: number) => `≈ ${numberFormat.format(count)}`,
    pagesHint: 'Geschätzt mit 250 Wörtern pro Seite',
    finalShare: 'Fertig',
    finalShareHint: 'Anteil der Wörter in Szenen mit Status „Fertig“',
    progress: 'Fortschritt',
    progressBy: 'Fortschritt messen in',
    unitWords: 'Wörter',
    unitScenes: 'Szenen',
    chapters: 'Wörter je Kapitel',
    chapterLabel: (number: number, title: string) => `${number}. ${title}`,
    chapterTip: (number: number, title: string) => `Kapitel ${number}: ${title}`,
    presence: 'Auftritte',
    presenceHint:
      'Wer in welcher Szene vorkommt – aus den Verknüpfungen in den Szenendetails. Ein Punkt öffnet die Szene.',
    presenceOf: 'Auftritte zeigen für',
    inScenes: (count: number) =>
      count === 1 ? 'in 1 Szene' : `in ${numberFormat.format(count)} Szenen`,
    appearsTip: (name: string, chapter: number, scene: string) =>
      `${name} · Kapitel ${chapter} › ${scene}`,
    absent: 'In keiner Szene:',
    noScenes: 'Noch keine Szenen – sobald es welche gibt, steht hier der Fortschritt.',
    noChapters: 'Noch keine Kapitel.',
    noNotes: (label: string) => `Noch keine ${label}.`,
    noLinks: 'Noch keine Verknüpfungen – trage in den Szenendetails ein, wer vorkommt.',
    writing: 'Schreibtage',
    writingHint:
      'Selbst getippte Wörter je Tag – Überarbeiten zählt mit, Eingefügtes nicht. Ein Tag beginnt um 4 Uhr.',
    writingToday: 'Heute',
    writingLast7: 'Letzte 7 Tage',
    writingLast30: 'Letzte 30 Tage',
    writingBest: 'Bester Tag',
    writingEmpty: 'Noch nichts aufgezeichnet – ab jetzt zählt jeder Tag.',
    dayTip: (date: string, written: number, removed: number, pasted: number) =>
      [
        `${date}: ${written ? `${numberFormat.format(written)} geschrieben` : 'nichts geschrieben'}`,
        removed ? `${numberFormat.format(removed)} gestrichen` : '',
        pasted ? `${numberFormat.format(pasted)} eingefügt` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    less: 'Weniger',
    more: 'Mehr',
    levelTip: (from: number, to: number | null) =>
      to === null
        ? `ab ${numberFormat.format(from)} Wörter`
        : `${numberFormat.format(from)}–${numberFormat.format(to)} Wörter`,
    text: 'Text',
    textHint:
      'Aus dem reinen Text aller Szenen; wörtliche Rede nach den eingestellten Anführungszeichen. Die Zahlen zeigen Tendenzen, keine exakten Werte.',
    textEmpty: 'Noch kein Text – sobald die Szenen Text haben, steht hier mehr.',
    dialogueShare: 'Dialoganteil',
    sentenceLength: 'Ø Satzlänge',
    fillersPer1000: 'Füllwörter je 1.000 Wörter',
    percent: (value: number) => `${numberFormat.format(Math.round(value))} %`,
    decimal: (value: number) => decimalFormat.format(value),
    wordsPerSentence: (value: number) => `${decimalFormat.format(value)} Wörter`,
    chapterColumn: 'Kapitel',
    dialogueColumn: 'Dialog',
    sentenceColumn: 'Ø Satzlänge',
    dialogueTip: (chapter: string, dialogue: number, words: number) =>
      `${chapter} · ${numberFormat.format(dialogue)} von ${numberFormat.format(words)} Wörtern in wörtlicher Rede`,
    sentenceTip: (chapter: string, sentences: number) =>
      `${chapter} · ${numberFormat.format(sentences)} ${sentences === 1 ? 'Satz' : 'Sätze'}`,
    fillers: 'Füllwörter',
    fillersHint: 'Aus einer festen Liste. Ein Klick sucht die Stellen im Buch.',
    noFillers: 'Keine Füllwörter aus der Liste gefunden.',
    noTopWords: 'Noch kein Wort kommt öfter als einmal vor.',
    topWords: 'Lieblingswörter',
    topWordsHint:
      'Die häufigsten Wörter – ohne Artikel, Pronomen & Co. und ohne Namen von Charakteren und Orten.',
    searchFor: (word: string, count: number) =>
      `${numberFormat.format(count)}× – „${word}“ im Buch suchen`,
    calendarLabel: (last30: number) =>
      `Kalender der Schreibtage im letzten Jahr; in den letzten 30 Tagen ${numberFormat.format(last30)} Wörter geschrieben`,
  },

  revision: {
    label: 'Überarbeiten',
    toggle:
      'Überarbeitungsmodus: Wiederholungen, Füllwörter, lange Sätze und doppelte Wörter markieren',
    next: 'Zur nächsten Stelle springen',
    counts: {
      repetition: (count: number) =>
        count === 1 ? '1 Wiederholung' : `${numberFormat.format(count)} Wiederholungen`,
      filler: (count: number) =>
        count === 1 ? '1 Füllwort' : `${numberFormat.format(count)} Füllwörter`,
      long: (count: number) =>
        count === 1 ? '1 langer Satz' : `${numberFormat.format(count)} lange Sätze`,
      double: (count: number) =>
        count === 1 ? '1 doppeltes Wort' : `${numberFormat.format(count)} doppelte Wörter`,
    },
    repeatedBefore: (word: string, distance: number) =>
      `Wiederholung: „${word}“ steht ${distance} Wörter vorher schon einmal`,
    repeatedAfter: (word: string, distance: number) =>
      `Wiederholung: „${word}“ kommt ${distance} Wörter später noch einmal`,
    fillerTip: (word: string) => `Füllwort: „${word}“`,
    longTip: (words: number) => `Langer Satz: ${numberFormat.format(words)} Wörter`,
    doubleTip: (word: string) => `Doppeltes Wort: „${word} ${word}“`,
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
    strands: 'Stränge',
    strand: 'Strang',
    allStrandsUsed: 'Die Szene gehört schon zu allen Strängen – tippe einen neuen Namen.',
    noStrands: 'Noch keine Stränge – tippe einen Namen, um ihn anzulegen.',
    createStrand: (name: string) => `„${name}“ als neuen Strang anlegen`,
    editStrand: 'Strang bearbeiten',
    editStrandLabel: (name: string) => `Strang „${name}“ bearbeiten`,
    strandName: 'Name',
    strandColor: 'Farbe',
    strandColors: {
      violet: 'Violett',
      teal: 'Türkis',
      rose: 'Rosa',
      amber: 'Ocker',
      blue: 'Blau',
      green: 'Grün',
      coral: 'Koralle',
      slate: 'Schiefer',
    },
    deleteStrand: 'Strang löschen …',
    deleteStrandTitle: 'Strang löschen?',
    deleteStrandMessage: (name: string, sceneCount: number) =>
      sceneCount === 0
        ? `Der Strang „${name}“ wird gelöscht.`
        : `Der Strang „${name}“ wird gelöscht. ${sceneCount === 1 ? 'Die eine Szene darin bleibt' : `Die ${sceneCount} Szenen darin bleiben`} erhalten, gehören aber nicht mehr zu diesem Strang.`,
    turningPoint: 'Wendepunkt',
    turningPointHint: 'Ein wichtiges Ereignis der Handlung',
  },

  book: {
    title: 'Buch',
    titleLabel: 'Titel',
    author: 'Autor',
    authorPlaceholder: 'Dein Name oder Pseudonym',
    authorHint:
      'Erscheint auf der Titelseite, in der Kopfzeile der Normseite und in den Angaben von E-Book und Word-Datei.',
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
        description: 'Buchsatz mit Silbentrennung – Format, Schrift und Ränder wählbar.',
      },
    },
    layout: 'Satzspiegel',
    pageSize: 'Seitengröße',
    customSize: 'Eigene Größe',
    defaultMark: 'Vorgabe',
    width: 'Breite',
    height: 'Höhe',
    margins: 'Ränder',
    marginInner: 'Innen',
    marginOuter: 'Außen',
    marginTop: 'Oben',
    marginBottom: 'Unten',
    marginsHint: 'Innen ist der Rand am Buchrücken – auf linken und rechten Seiten gespiegelt.',
    font: 'Schrift',
    fontSize: 'Schriftgröße',
    fontNotInTex: 'nicht in TeX',
    fontMissingPdf: (font: string) =>
      `„${font}“ fehlt in deiner TeX-Installation – das PDF verwendet stattdessen Latin Modern.`,
    fontMissingPreview:
      'Diese Schrift ist auf deinem Rechner nicht installiert; die Vorschau zeigt eine Ersatzschrift.',
    fontWordHint: 'In Word erscheint die Schrift nur, wenn sie auf dem Rechner installiert ist.',
    resetLayout: 'Zurücksetzen',
    unitMm: 'mm',
    unitPt: 'pt',
    preview: 'Vorschau',
    previewHint:
      'Annäherung – Zeilen- und Seitenumbrüche können im fertigen Dokument etwas abweichen.',
    previewEmpty: 'Noch kein Text – sobald ein Kapitel Text hat, erscheint er hier.',
    previewNone:
      'HTML und E-Books haben keine festen Seiten – der Text passt sich Bildschirm bzw. Reader an. Deshalb gibt es hier keine Seitenvorschau.',
    previewPages: 'Titelseite und die ersten Seiten',
    cover: 'Titelbild',
    coverDropHint: 'oder ein Bild hierher ziehen',
    coverShown: 'Erscheint im Reader als Cover und in der Bibliothek.',
    coverMissing: 'Ohne Titelbild zeigen Reader das Buch als leere Kachel.',
    coverSize: 'Am besten im Hochformat, etwa 1600 × 2560 Pixel.',
    chooseImage: 'Anderes Bild wählen',
    designCover: 'Aus Titel gestalten',
    otherColors: 'Andere Farben',
    removeCover: 'Titelbild entfernen',
    sceneTitles: 'Szenentitel als Zwischenüberschriften drucken',
    sceneTitlesHint: '(sonst stehen zwischen Szenen nur Trenner)',
    parts: 'Teile drucken',
    partsHint: '(sonst folgen die Kapitel direkt aufeinander)',
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
    /** Example sentence with double and single quotation marks and an apostrophe. */
    quoteExample: (double: readonly string[], single: readonly string[], apostrophe: string) =>
      `${double[0]}Sag ${single[0]}bitte${single[1]}${double[1]}, flüstert${apostrophe}s.`,
  },
};

export type Texts = typeof de;
