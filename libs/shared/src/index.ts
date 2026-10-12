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

export interface UpdateProjectRequest {
  title?: string;
  author?: string;
}

// ---------------------------------------------------------------------------
// Manuskript-Baum: Teil → Kapitel → Szene
// ---------------------------------------------------------------------------

export type NodeKind = 'part' | 'chapter' | 'scene';

export interface ManuscriptNode {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  title: string;
  sortOrder: number;
  /** Nur bei Szenen > 0. */
  wordCount: number;
}

export interface CreateNodeRequest {
  parentId: string | null;
  kind: NodeKind;
  title: string;
}

export interface UpdateNodeRequest {
  title?: string;
  parentId?: string | null;
  sortOrder?: number;
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
  updatedAt: string | null;
}

export interface SaveSceneContentRequest {
  doc: EditorDoc;
  /** Reiner Text für die Volltextsuche, kommt aus `editor.getText()`. */
  text: string;
  wordCount: number;
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
  nodeId: string;
  title: string;
  /** Textausschnitt; Treffer sind mit <mark>…</mark> markiert, sonst HTML-escaped. */
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
