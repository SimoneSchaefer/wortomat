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

/** Einstellungen der App (nicht des Buchs) – z. B. Breite der Seitenleiste. */
export interface AppSettings {
  /** Breite der Seitenleiste in Pixeln; `null` = Standardbreite. */
  sidebarWidth: number | null;
}

export type UpdateAppSettingsRequest = Partial<AppSettings>;

// ---------------------------------------------------------------------------
// Projekt (= eine .wortomat-Datei, intern eine SQLite-Datenbank)
// ---------------------------------------------------------------------------

export interface ProjectInfo {
  filePath: string;
  title: string;
  author: string;
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
  /** Letzte Änderung am Buch (aus der Datei); `null` wenn nicht lesbar. */
  updatedAt: string | null;
  /** Wann das Buch zuletzt in Wortomat geöffnet wurde. */
  lastOpenedAt: string;
}

export interface ForgetProjectRequest {
  filePath: string;
}

export interface UpdateProjectRequest {
  title?: string;
  author?: string;
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
  updatedAt: string;
  /** Erstes Bild der Galerie (Profilbild), z. B. `/api/images/<id>`; `null` ohne Bilder. */
  coverImageUrl: string | null;
}

export interface NoteContent {
  id: string;
  doc: EditorDoc | null;
  wordCount: number;
  updatedAt: string | null;
}

export interface CreateNoteRequest {
  kind: NoteKind;
  title: string;
}

export interface UpdateNoteRequest {
  title?: string;
  summary?: string;
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

/** Vergibt einen Tag per Name; gibt es ihn (ohne Groß-/Kleinschreibung) schon, wird er wiederverwendet. */
export interface AddTagRequest {
  name: string;
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
}
