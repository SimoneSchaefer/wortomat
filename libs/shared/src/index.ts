/**
 * API-Vertrag zwischen Angular-Frontend, NestJS-Backend und Electron-Shell.
 *
 * Dieses Paket enthält bewusst nur Typen. Es wird überall mit `import type`
 * eingebunden und verschwindet beim Kompilieren vollständig.
 */

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export type AppMode = 'desktop' | 'browser';

export interface AppInfo {
  version: string;
  mode: AppMode;
  /** Vorschlag für den Speicherort neuer Projekte (z. B. ~/Documents). */
  defaultProjectDir: string;
}

/**
 * Welche Anführungszeichen der Editor beim Tippen von " und ' setzt:
 * - `de`: „Deutsch“ und ‚einfach‘
 * - `de-guillemets`: »Deutsch« und ›einfach‹ (Buchsatz)
 * - `ch`: «Schweiz» und ‹einfach›
 * - `en`: “English” and ‘single’
 * - `fr`: « français » et ‹ simple › (mit schmalem geschütztem Leerzeichen)
 * - `off`: nichts ersetzen
 */
export type QuoteStyle = 'de' | 'de-guillemets' | 'ch' | 'en' | 'fr' | 'off';

/** Sprache der Oberfläche (nicht des Buchs). */
export type Language = 'de' | 'en';

/** Farbschema: `system` folgt der Einstellung des Betriebssystems. */
export type Theme = 'system' | 'light' | 'dark';

/** Schriftgröße der ganzen Oberfläche (inkl. Editor). */
export type FontSize = 'small' | 'medium' | 'large';

/** Einstellungen der App (nicht des Buchs) – z. B. Breite der Seitenleiste. */
export interface AppSettings {
  /** Sprache der Oberfläche; `null` = wie das System (Deutsch, sonst Englisch). */
  language: Language | null;
  /** Breite der Seitenleiste in Pixeln; `null` = Standardbreite. */
  sidebarWidth: number | null;
  /** Typografische Anführungszeichen beim Schreiben. */
  quoteStyle: QuoteStyle;
  theme: Theme;
  fontSize: FontSize;
  /** Überarbeitungsmodus im Editor: Wiederholungen, Füllwörter usw. markieren. */
  revisionMode: boolean;
}

export type UpdateAppSettingsRequest = Partial<AppSettings>;

// ---------------------------------------------------------------------------
// Projekt (= eine .wortomat-Datei, intern eine SQLite-Datenbank)
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  filePath: string;
  title: string;
  author: string;
  /** Titelbild (z. B. fürs E-Book); `null`, wenn keins gesetzt ist. */
  coverImageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  filePath: string;
  title: string;
  author?: string;
}

export interface OpenProjectRequest {
  filePath: string;
}

/** Eintrag der Projektliste auf der Startseite. */
export interface ProjectListEntry {
  filePath: string;
  /** Aus der Datei gelesen; bei fehlender Datei der Dateiname. */
  title: string;
  author: string;
  /** `false`, wenn die Datei verschoben, gelöscht oder unlesbar ist. */
  available: boolean;
  /** Gerade geöffnet? */
  isOpen: boolean;
  wordCount: number;
  /**
   * Titelbild aus der Datei; `null`, wenn keins gesetzt ist. Abrufbar unter
   * `/api/projects/cover?filePath=…&id=…` – auch wenn das Buch nicht geöffnet ist.
   */
  coverImageId: string | null;
  /** Letzte Änderung am Buch (aus der Datei); `null` wenn nicht lesbar. */
  updatedAt: string | null;
  /** Wann das Buch zuletzt in Wortomat geöffnet wurde. */
  lastOpenedAt: string;
}

/** Eintrag im Dateiauswahl-Dialog (Browser-Modus): Ordner oder Projektdatei. */
export interface DirectoryEntry {
  name: string;
  path: string;
  kind: 'directory' | 'project';
}

/** Inhalt eines Ordners – nur Unterordner und .wortomat-Dateien, ohne versteckte. */
export interface DirectoryListing {
  path: string;
  /** `null` im Wurzelverzeichnis. */
  parent: string | null;
  entries: DirectoryEntry[];
}

export interface ForgetProjectRequest {
  filePath: string;
}

export interface UpdateProjectRequest {
  title?: string;
  author?: string;
  /** Ein hochgeladenes Bild als Titelbild setzen; `null` entfernt es. */
  coverImageId?: string | null;
}

// ---------------------------------------------------------------------------
// Manuskript-Baum: Teil → Kapitel → Szene
// ---------------------------------------------------------------------------

export type NodeKind = 'part' | 'chapter' | 'scene';

/** Markierungen im Text: Stellen, an denen noch etwas zu tun ist. */
export type AnnotationKind = 'todo' | 'idea' | 'fixme';

/** Anzahl markierter Stellen je Art; zusammenhängend markierter Text zählt einmal. */
export type AnnotationCounts = Record<AnnotationKind, number>;

/** Arbeitsstand einer Szene – in dieser Reihenfolge. */
export type SceneStatus = 'idea' | 'outline' | 'draft' | 'revised' | 'final';

export interface ManuscriptNode {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  title: string;
  sortOrder: number;
  /** Nur bei Szenen > 0. */
  wordCount: number;
  /** Nur bei Szenen gesetzt, sonst `null`. */
  status: SceneStatus | null;
  /** Todo/Idee/Fixme-Markierungen im Text; nur bei Szenen, sonst `null`. */
  annotations: AnnotationCounts | null;
  /** Wichtiges Ereignis der Handlung; nur bei Szenen, sonst `null`. */
  turningPoint: boolean | null;
  /**
   * Position in der Reihenfolge der Handlung (unabhängig vom Buch); gleiche Werte bedeuten
   * „gleichzeitig“. `null`: noch nie festgelegt – die Szene folgt ihrer Vorgängerin im Buch.
   */
  storyOrder: number | null;
}

export interface CreateNodeRequest {
  parentId: string | null;
  kind: NodeKind;
  title: string;
}

export interface UpdateNodeRequest {
  title?: string;
  /** Nur für Szenen. */
  status?: SceneStatus;
  /** Nur für Szenen. */
  turningPoint?: boolean;
}

/**
 * Verschiebt einen Knoten (samt Unterknoten) an eine neue Stelle im Baum.
 * Die Reihenfolge berechnet das Backend; der Client nennt nur den Nachbarn.
 */
export interface MoveNodeRequest {
  /** Neues Elternelement; `null` = oberste Ebene. */
  parentId: string | null;
  /** Geschwister, vor dem eingefügt wird; `null` = ans Ende. */
  beforeId: string | null;
}

// ---------------------------------------------------------------------------
// Szeneninhalt
// ---------------------------------------------------------------------------

/**
 * Editor-Dokument im ProseMirror/Tiptap-JSON-Format.
 * Das Backend behandelt es als undurchsichtigen Blob.
 */
export interface EditorDoc {
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
}

export interface SceneContent {
  nodeId: string;
  doc: EditorDoc | null;
  wordCount: number;
  /** Vom Backend aus dem Dokument gezählt. */
  annotations: AnnotationCounts;
  updatedAt: string | null;
}

/** Speichern eines Editor-Dokuments – gleich für Szenen und Notizen. */
export interface SaveDocumentRequest {
  doc: EditorDoc;
  /** Reiner Text für die Volltextsuche, kommt aus `editor.getText()`. */
  text: string;
  wordCount: number;
  /**
   * Seit dem letzten Speichern eingefügte oder per Ziehen verschobene Wörter. Sie zählen im
   * Schreib-Log nicht als geschrieben.
   */
  pastedWords?: number;
}

/** `GET /api/scene-texts`: reiner Text einer Szene (z. B. für die Textstatistik). */
export interface SceneText {
  sceneId: string;
  /** Absätze durch Zeilenumbrüche getrennt. */
  text: string;
}

/** Ein Tag im Schreib-Log (Summe über alle Szenen). */
export interface WritingDay {
  /** YYYY-MM-DD; der Tag beginnt um 4 Uhr. */
  day: string;
  /** Selbst geschriebene Wörter (brutto, Überarbeiten zählt mit). */
  added: number;
  removed: number;
  pasted: number;
}

// ---------------------------------------------------------------------------
// Notizen: Charaktere, Orte, Forschung
// ---------------------------------------------------------------------------

export type NoteKind = 'character' | 'place' | 'research';

export interface NoteSummary {
  id: string;
  kind: NoteKind;
  title: string;
  /** Einzeilige Kurzbeschreibung für die Liste, z. B. „Protagonistin, 34, Ärztin“. */
  summary: string;
  /** Gruppe in der Liste (`NoteGroup`); `null` = ohne Gruppe. */
  groupId: string | null;
  updatedAt: string;
  /** Erstes Bild der Galerie (Profilbild), z. B. `/api/images/<id>`; `null` ohne Bilder. */
  coverImageUrl: string | null;
  /** Todo/Idee/Fixme-Markierungen im Text. */
  annotations: AnnotationCounts;
}

export interface NoteContent {
  id: string;
  doc: EditorDoc | null;
  wordCount: number;
  /** Vom Backend aus dem Dokument gezählt. */
  annotations: AnnotationCounts;
  updatedAt: string | null;
}

export interface CreateNoteRequest {
  kind: NoteKind;
  title: string;
}

export interface UpdateNoteRequest {
  title?: string;
  summary?: string;
  /** `null` nimmt die Notiz aus ihrer Gruppe. */
  groupId?: string | null;
}

/** Gruppe in der Notizliste, z. B. „Familie Berger“ – gehört zu genau einer Notizart. */
export interface NoteGroup {
  id: string;
  kind: NoteKind;
  name: string;
}

export interface CreateNoteGroupRequest {
  kind: NoteKind;
  name: string;
}

export interface UpdateNoteGroupRequest {
  name: string;
}

/** Verschiebt eine Gruppe innerhalb ihrer Notizart. */
export interface MoveNoteGroupRequest {
  /** Gruppe, vor der eingefügt wird; `null` = ans Ende. */
  beforeId: string | null;
}

/** Verknüpft eine Notiz (Charakter, Ort …) mit einer Szene. */
export interface LinkNoteRequest {
  noteId: string;
}

/** Szene, in der eine Notiz vorkommt – mit Pfad im Manuskript für die Anzeige. */
export interface SceneReference {
  id: string;
  title: string;
  /** Titel der übergeordneten Teile/Kapitel, von außen nach innen. */
  path: string[];
}

// ---------------------------------------------------------------------------
// Karten: grob gezeichnete Landkarten, auf denen Orte eingezeichnet sind
// ---------------------------------------------------------------------------

/** Eintrag der Kartenliste in der Seitenleiste „Orte“. */
export interface MapSummary {
  id: string;
  name: string;
  updatedAt: string;
}

/**
 * Ein Strich auf der Karte, freihand gezeichnet:
 * - `pen`: Linie (Küste, Fluss, Straße …)
 * - `area`: geschlossene, halb durchsichtig gefüllte Fläche (See, Wald …)
 */
export interface MapStroke {
  tool: 'pen' | 'area';
  /** `#rrggbb` */
  color: string;
  /** Strichstärke in Karteneinheiten. */
  width: number;
  /** Abwechselnd x und y in Karteneinheiten: `[x0, y0, x1, y1, …]`. */
  points: number[];
}

/** Ein Ort (Notiz der Art `place`) auf der Karte, in Karteneinheiten. */
export interface MapPin {
  noteId: string;
  x: number;
  y: number;
}

export interface PlaceMap extends MapSummary {
  /** Größe der Zeichenfläche in Karteneinheiten (Seitenverhältnis wie das Hintergrundbild). */
  width: number;
  height: number;
  /** Hintergrundbild, z. B. eine abfotografierte Skizze; `null` = leeres Papier. */
  backgroundImageId: string | null;
  /** Deckkraft des Hintergrundbilds, 0.1 … 1 (blasser zum Nachzeichnen). */
  backgroundOpacity: number;
  strokes: MapStroke[];
  pins: MapPin[];
}

export interface CreateMapRequest {
  name: string;
}

/** Nur die angegebenen Felder ändern sich; `strokes` und `pins` ersetzen den alten Stand. */
export interface UpdateMapRequest {
  name?: string;
  width?: number;
  height?: number;
  backgroundImageId?: string | null;
  backgroundOpacity?: number;
  strokes?: MapStroke[];
  pins?: MapPin[];
}

// ---------------------------------------------------------------------------
// Tags (projektweit, an Szenen vergeben)
// ---------------------------------------------------------------------------

export interface Tag {
  id: string;
  name: string;
}

/** Tag mit Anzahl der Szenen, in denen er vorkommt – für Vorschläge. */
export interface TagSummary extends Tag {
  sceneCount: number;
}

/** Was einer Szene zugeordnet ist (Charaktere, Orte, Tags) – z. B. für den Szenenfilter. */
export interface SceneRelations {
  sceneId: string;
  /** Verknüpfte Notizen (Charaktere, Orte …). */
  noteIds: string[];
  tags: Tag[];
  strandIds: string[];
}

/** Vergibt einen Tag per Name; gibt es ihn (ohne Groß-/Kleinschreibung) schon, wird er wiederverwendet. */
export interface AddTagRequest {
  name: string;
}

// ---------------------------------------------------------------------------
// Handlungsstränge (projektweit, an Szenen vergeben)
// ---------------------------------------------------------------------------

/** Feste Farben für Stränge; die Töne stehen in styles.scss (`--strand-<farbe>`), hell und dunkel. */
export type StrandColor =
  'violet' | 'teal' | 'rose' | 'amber' | 'blue' | 'green' | 'coral' | 'slate';

/**
 * Ein Handlungsstrang, z. B. „Lena“ oder „Die Ermittlung“. Eine Szene kann zu mehreren
 * Strängen gehören – dort laufen sie zusammen.
 */
export interface Strand {
  id: string;
  name: string;
  color: StrandColor;
  /** Anzahl der Szenen in diesem Strang. */
  sceneCount: number;
}

export interface CreateStrandRequest {
  name: string;
  /** Ohne Angabe die am wenigsten benutzte Farbe. */
  color?: StrandColor;
}

export interface UpdateStrandRequest {
  name?: string;
  color?: StrandColor;
}

/** Ordnet eine Szene einem Strang zu. */
export interface AddSceneStrandRequest {
  strandId: string;
}

// ---------------------------------------------------------------------------
// Reihenfolge der Handlung
// ---------------------------------------------------------------------------

/** Beginn eines Abschnitts in der Handlung, z. B. „Tag 1“ oder „Winter“. */
export interface StoryMark {
  id: string;
  label: string;
  /** Die Marke steht vor der ersten Szene, deren `storyOrder` mindestens so groß ist. */
  position: number;
}

/**
 * Legt die ganze Reihenfolge der Handlung fest. Szenen, die fehlen, folgen wieder ihrer
 * Vorgängerin im Buch; leer = alles zurück auf die Buchreihenfolge.
 */
export interface SaveStoryRequest {
  /** Spalten von früh nach spät; Szenen in derselben Spalte passieren gleichzeitig. */
  columns: string[][];
  /** Alle Marken (ersetzen die bisherigen); ohne `id` wird eine neu angelegt. */
  marks: Array<{ id?: string; label: string; beforeColumn: number }>;
}

export interface StoryState {
  nodes: ManuscriptNode[];
  marks: StoryMark[];
}

/** Neue Reihenfolge der Galerie; das erste Bild ist das Profilbild. */
export interface ReorderImagesRequest {
  imageIds: string[];
}

// ---------------------------------------------------------------------------
// Bilder
// ---------------------------------------------------------------------------

/** SVG ist absichtlich ausgeschlossen (kann Skripte enthalten). */
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/avif';

export interface ImageInfo {
  id: string;
  mimeType: ImageMimeType;
  width: number | null;
  height: number | null;
  byteSize: number;
  originalName: string | null;
  /** Relativ zum App-Origin, z. B. `/api/images/<id>`. */
  url: string;
}

// ---------------------------------------------------------------------------
// Suche
// ---------------------------------------------------------------------------

export interface SearchHit {
  /** Szene oder Art der Notiz – bestimmt, wohin ein Klick führt. */
  kind: 'scene' | NoteKind;
  id: string;
  title: string;
  /**
   * Textausschnitt aus Text oder Kurzbeschreibung; Treffer sind mit <mark>…</mark> markiert,
   * sonst HTML-escaped. Leer, wenn nur der Titel passt.
   */
  snippetHtml: string;
}

// ---------------------------------------------------------------------------
// Export des Manuskripts
// ---------------------------------------------------------------------------

export type ExportFormat = 'html' | 'docx' | 'pdf' | 'epub';

/** Vorlage für Word und PDF (HTML und EPUB haben ein festes Layout). */
export type ExportTemplate = 'normseite' | 'roman';

/** Schriften zur Auswahl für die Vorlage „Roman“ (jeweils für PDF und Word verfügbar). */
export type BookFont =
  | 'palatino'
  | 'garamond'
  | 'libertinus'
  | 'charter'
  | 'times'
  | 'schoolbook'
  | 'bookman'
  | 'sourceserif'
  | 'crimson'
  | 'latinmodern'
  | 'computermodern';

/**
 * Satzspiegel der Vorlage „Roman“ (die Normseite ist genormt und bleibt fest).
 * Maße in Millimetern, Schriftgröße in Punkt. Gedruckt wird doppelseitig: „innen“ ist der
 * Rand am Bund, „außen“ der am Seitenrand.
 */
export interface BookLayout {
  pageWidth: number;
  pageHeight: number;
  marginInner: number;
  marginOuter: number;
  marginTop: number;
  marginBottom: number;
  font: BookFont;
  fontSize: number;
}

/** Was der Export-Dialog sich pro Buch merkt (in der Projektdatei gespeichert). */
export interface ExportSettings {
  format: ExportFormat;
  template: ExportTemplate;
  includeSceneTitles: boolean;
  layout: BookLayout;
}

/** `GET /api/export/settings` */
export interface ExportSettingsResponse {
  settings: ExportSettings;
  /** Vorgaben, z. B. für „Zurücksetzen“. */
  defaults: ExportSettings;
}

/** Eine wählbare Schrift samt CSS-Schriftfamilie für die Vorschau. */
export interface BookFontInfo {
  id: BookFont;
  label: string;
  cssFamily: string;
  /** Ist ein passendes TeX-Paket installiert? Sonst setzt das PDF in Latin Modern. */
  pdfAvailable: boolean;
  /** Nur anbieten, wenn `pdfAvailable` (oder die Schrift schon gewählt ist). */
  optional: boolean;
}

/** `GET /api/export/preview`: Anfang des Buchs für die Seitenvorschau. */
export interface ExportPreview {
  title: string;
  author: string;
  /** Erstes Kapitel mit Text; `null`, wenn das Buch noch leer ist. */
  chapterTitle: string | null;
  /** Szenen dieses Kapitels als HTML (Absätze, Szenentrenner bzw. -titel, Bilder). */
  html: string;
}

export interface ExportRequest {
  format: ExportFormat;
  template: ExportTemplate;
  /** Szenentitel als Zwischenüberschriften drucken (sonst nur Szenentrenner). */
  includeSceneTitles: boolean;
  /** Satzspiegel für „Roman“; fehlt er, gelten die Vorgaben. */
  layout?: BookLayout;
  /**
   * Zielpfad (Desktop: aus dem Speichern-Dialog). Ohne Pfad liefert der Server die Datei
   * direkt als Download aus (Browser-Modus).
   */
  filePath?: string;
}

export interface ExportResult {
  filePath: string;
  /** Hinweise, z. B. Bilder, die in diesem Format nicht übernommen werden konnten. */
  warnings: string[];
}

export interface ExportCapabilities {
  pdf: {
    available: boolean;
    /** z. B. „pdfTeX 3.141592653-2.6-1.40.25 (TeX Live 2023)“ */
    version: string | null;
  };
  /** Schriften für die Vorlage „Roman“. */
  fonts: BookFontInfo[];
}

// ---------------------------------------------------------------------------
// Electron-Bridge (vom Preload-Skript als `window.wortomat` bereitgestellt)
// ---------------------------------------------------------------------------

export interface DesktopBridge {
  readonly isDesktop: true;
  /** Zeigt den nativen „Öffnen“-Dialog. `null` = abgebrochen. */
  showOpenProjectDialog(): Promise<string | null>;
  /** Zeigt den nativen „Speichern unter“-Dialog. `null` = abgebrochen. */
  showCreateProjectDialog(suggestedName: string): Promise<string | null>;
  /**
   * Wird aufgerufen, bevor das Fenster schließt oder ein anderes Projekt geöffnet wird.
   * Das Fenster wartet (mit Timeout), bis das Promise erfüllt ist – Zeit, um zu speichern.
   */
  onBeforeClose(handler: () => Promise<void>): void;
  /** „Speichern unter“ für einen Export. `null` = abgebrochen. */
  showExportDialog(suggestedName: string, format: ExportFormat): Promise<string | null>;
  /** Öffnet eine exportierte Datei mit dem Standardprogramm. */
  openPath(filePath: string): Promise<void>;
  /** Zeigt eine Datei im Dateimanager. */
  showItemInFolder(filePath: string): Promise<void>;
  /** Sprache für native Menüs und Dialoge (Kontextmenü, „Speichern unter“ …). */
  setLanguage(language: Language): void;
  /** Farbschema für Fensterrahmen, Menüs und Dialoge. */
  setTheme(theme: Theme): void;
}
