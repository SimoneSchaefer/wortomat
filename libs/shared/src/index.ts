/**
 * API contract between the Angular frontend, the NestJS backend and the Electron shell.
 *
 * This package deliberately contains only types. It is imported everywhere with `import type` and
 * disappears completely when compiling.
 */

export type AppMode = 'desktop' | 'browser';

export interface AppInfo {
  version: string;
  mode: AppMode;
  /** Suggested location for new projects (e.g. ~/Documents). */
  defaultProjectDir: string;
}

/**
 * Which quotation marks the editor sets when typing " and ':
 * - `de`: „Deutsch“ and ‚einfach‘
 * - `de-guillemets`: »Deutsch« and ›einfach‹ (book typesetting)
 * - `ch`: «Schweiz» and ‹einfach›
 * - `en`: “English” and ‘single’
 * - `fr`: « français » et ‹ simple › (with a narrow no-break space)
 * - `off`: replace nothing
 */
export type QuoteStyle = 'de' | 'de-guillemets' | 'ch' | 'en' | 'fr' | 'off';

/** Of the UI, not of the book. */
export type Language = 'de' | 'en';

/** `system` follows the OS setting. */
export type Theme = 'system' | 'light' | 'dark';

/** Of the whole UI, including the editor. */
export type FontSize = 'small' | 'medium' | 'large';

/** Of the app, not of the book. */
export interface AppSettings {
  /** `null` = like the system (German, else English). */
  language: Language | null;
  /** In pixels; `null` = default width. */
  sidebarWidth: number | null;
  quoteStyle: QuoteStyle;
  theme: Theme;
  fontSize: FontSize;
  /** Revision mode in the editor: marks repetitions, filler words etc. */
  revisionMode: boolean;
  plotView: PlotViewSettings;
}

export interface PlotViewSettings {
  order: 'story' | 'book';
  onlyTurningPoints: boolean;
  /** Narrow columns without scene titles – for long books. */
  compact: boolean;
  /** Time runs downwards and the threads stand side by side, instead of left to right. */
  vertical: boolean;
}

export type UpdateAppSettingsRequest = Partial<Omit<AppSettings, 'plotView'>> & {
  plotView?: Partial<PlotViewSettings>;
};

export interface ProjectInfo {
  filePath: string;
  title: string;
  author: string;
  /** `null` when none is set. */
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

export interface ProjectListEntry {
  filePath: string;
  /** Read from the file; the file name when the file is missing. */
  title: string;
  author: string;
  /** `false` when the file was moved, deleted or is unreadable. */
  available: boolean;
  isOpen: boolean;
  wordCount: number;
  /**
   * `null` when none is set. Available at `/api/projects/cover?filePath=…&id=…` – even when the
   * book is not open.
   */
  coverImageId: string | null;
  /** From the file; `null` when unreadable. */
  updatedAt: string | null;
  lastOpenedAt: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  kind: 'directory' | 'project';
}

/** Only subfolders and .wortomat files, without hidden ones. */
export interface DirectoryListing {
  path: string;
  /** `null` at the root. */
  parent: string | null;
  entries: DirectoryEntry[];
}

export interface ForgetProjectRequest {
  filePath: string;
}

export interface UpdateProjectRequest {
  title?: string;
  author?: string;
  /** `null` removes it. */
  coverImageId?: string | null;
}

export type NodeKind = 'part' | 'chapter' | 'scene';

export type AnnotationKind = 'todo' | 'idea' | 'fixme';

/** Contiguously marked text counts once. */
export type AnnotationCounts = Record<AnnotationKind, number>;

/** In this order. */
export type SceneStatus = 'idea' | 'outline' | 'draft' | 'revised' | 'final';

export interface ManuscriptNode {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  title: string;
  sortOrder: number;
  /** Greater than 0 only for scenes. */
  wordCount: number;
  /** Only set for scenes, otherwise `null`. */
  status: SceneStatus | null;
  /** Only for scenes, otherwise `null`. */
  annotations: AnnotationCounts | null;
  /** Only for scenes, otherwise `null`. */
  turningPoint: boolean | null;
  /**
   * Position in the story order (independent of the book); equal values mean "simultaneous".
   * `null`: never set – the scene follows its predecessor in the book.
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
  /** Only for scenes. */
  status?: SceneStatus;
  /** Only for scenes. */
  turningPoint?: boolean;
}

/** The backend computes the order; the client only names the neighbour. */
/**
 * Puts every scene of the book into a chapter, in this order – e.g. to take over the story order.
 * Chapters themselves stay where they are; one left out ends up without scenes.
 */
export interface ArrangeScenesRequest {
  chapters: Array<{ chapterId: string; sceneIds: string[] }>;
  /**
   * These scenes get `label` (e.g. "verschoben") at the very start of their text, marked as todo –
   * so they are easy to find in the manuscript afterwards.
   */
  markMoved?: { sceneIds: string[]; label: string };
}

export interface MoveNodeRequest {
  /** `null` = top level. */
  parentId: string | null;
  /** Sibling to insert before; `null` = at the end. */
  beforeId: string | null;
}

/** The backend treats it as an opaque blob. */
export interface EditorDoc {
  type: 'doc';
  content?: unknown[];
  [key: string]: unknown;
}

export interface SceneContent {
  nodeId: string;
  doc: EditorDoc | null;
  wordCount: number;
  /** Counted by the backend from the document. */
  annotations: AnnotationCounts;
  updatedAt: string | null;
}

/** Same for scenes and notes. */
export interface SaveDocumentRequest {
  doc: EditorDoc;
  /** For full-text search, from `editor.getText()`. */
  text: string;
  wordCount: number;
  /**
   * Words pasted or moved by dragging since the last save. They do not count as written in the
   * writing log.
   */
  pastedWords?: number;
}

export interface SceneText {
  sceneId: string;
  /** Paragraphs separated by line breaks. */
  text: string;
}

/** Summed over all scenes. */
export interface WritingDay {
  /** YYYY-MM-DD; the day starts at 4 am. */
  day: string;
  /** Words written by the author (gross, revising counts). */
  added: number;
  removed: number;
  pasted: number;
}

export type NoteKind = 'character' | 'place' | 'research';

export interface NoteSummary {
  id: string;
  kind: NoteKind;
  title: string;
  /** One line for the list, e.g. "Protagonist, 34, doctor". */
  summary: string;
  /** `null` = no group. */
  groupId: string | null;
  updatedAt: string;
  /** First gallery image (profile picture), e.g. `/api/images/<id>`; `null` without images. */
  coverImageUrl: string | null;
  /** `null` = whole image. */
  coverCrop: ImageCrop | null;
  annotations: AnnotationCounts;
}

export interface NoteContent {
  id: string;
  doc: EditorDoc | null;
  wordCount: number;
  /** Counted by the backend from the document. */
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
  /** `null` takes the note out of its group. */
  groupId?: string | null;
}

/** Belongs to exactly one note kind. */
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

/** Within its note kind. */
export interface MoveNoteGroupRequest {
  /** Group to insert before; `null` = at the end. */
  beforeId: string | null;
}

/** How a character changes: the overall arc as text and its stations in a chosen order. */
export interface CharacterArc {
  noteId: string;
  summary: string;
  steps: ArcStep[];
}

/** A station of the arc, e.g. "lets Lena help for the first time". */
export interface ArcStep {
  id: string;
  noteId: string;
  label: string;
  details: string;
  /** The scene where the station shows; `null` = none (yet). */
  sceneId: string | null;
}

export interface UpdateArcRequest {
  summary: string;
}

export interface CreateArcStepRequest {
  label?: string;
  sceneId?: string | null;
  /** Station to insert before; `null`/missing = at the end. */
  beforeId?: string | null;
}

export interface UpdateArcStepRequest {
  label?: string;
  details?: string;
  sceneId?: string | null;
}

/** All stations of the note in their new order. */
export interface ReorderArcStepsRequest {
  stepIds: string[];
}

export interface MoveArcStepRequest {
  /** Station to insert before; `null` = at the end. */
  beforeId: string | null;
}

export interface LinkNoteRequest {
  noteId: string;
}

/** With the path in the manuscript, for display. */
export interface SceneReference {
  id: string;
  title: string;
  /** Titles of the enclosing parts/chapters, outermost first. */
  path: string[];
}

export interface MapSummary {
  id: string;
  name: string;
  updatedAt: string;
}

/**
 * A freehand stroke:
 * - `pen`: line (coast, river, road …)
 * - `area`: closed, semi-transparently filled area (lake, forest …)
 */
export interface MapStroke {
  tool: 'pen' | 'area';
  /** `#rrggbb` */
  color: string;
  /** In map units. */
  width: number;
  /** Alternating x and y in map units: `[x0, y0, x1, y1, …]`. */
  points: number[];
}

/** A place (note of kind `place`) on the map, in map units. */
export interface MapPin {
  noteId: string;
  x: number;
  y: number;
}

export interface PlaceMap extends MapSummary {
  /** Canvas size in map units (aspect ratio of the background image). */
  width: number;
  height: number;
  /** E.g. a photographed sketch; `null` = blank paper. */
  backgroundImageId: string | null;
  /** 0.1 … 1 (paler for tracing). */
  backgroundOpacity: number;
  strokes: MapStroke[];
  pins: MapPin[];
}

export interface CreateMapRequest {
  name: string;
}

/** Only the given fields change; `strokes` and `pins` replace the previous state. */
export interface UpdateMapRequest {
  name?: string;
  width?: number;
  height?: number;
  backgroundImageId?: string | null;
  backgroundOpacity?: number;
  strokes?: MapStroke[];
  pins?: MapPin[];
}

export interface Tag {
  id: string;
  name: string;
}

/** With the number of scenes using it – for suggestions. */
export interface TagSummary extends Tag {
  sceneCount: number;
}

export interface SceneRelations {
  sceneId: string;
  noteIds: string[];
  tags: Tag[];
  strandIds: string[];
}

/** If it exists already (ignoring case), it is reused. */
export interface AddTagRequest {
  name: string;
}

/** The shades live in styles.scss (`--strand-<colour>`), light and dark. */
export type StrandColor =
  'violet' | 'teal' | 'rose' | 'amber' | 'blue' | 'green' | 'coral' | 'slate';

/** A scene can belong to several threads – that is where they merge. */
export interface Strand {
  id: string;
  name: string;
  color: StrandColor;
  sceneCount: number;
}

export interface CreateStrandRequest {
  name: string;
  /** Without one, the least used colour. */
  color?: StrandColor;
}

export interface UpdateStrandRequest {
  name?: string;
  color?: StrandColor;
}

/** Its row in the plot view. */
export interface MoveStrandRequest {
  /** Thread to insert before; `null` = at the end. */
  beforeId: string | null;
}

export interface AddSceneStrandRequest {
  strandId: string;
}

/** Start of a section in the story, e.g. "Day 1" or "Winter". */
export interface StoryMark {
  id: string;
  label: string;
  /** The mark sits before the first scene whose `storyOrder` is at least this large. */
  position: number;
}

/**
 * Missing scenes follow their predecessor in the book again; empty = everything back to book order.
 */
export interface SaveStoryRequest {
  /** From early to late; scenes in the same column happen at the same time. */
  columns: string[][];
  /** All marks (replace the previous ones); without `id` a new one is created. */
  marks: Array<{ id?: string; label: string; beforeColumn: number }>;
}

export interface StoryState {
  nodes: ManuscriptNode[];
  marks: StoryMark[];
}

/** The first image is the profile picture. */
export interface ReorderImagesRequest {
  imageIds: string[];
}

/** Text only, paragraph by paragraph. */
export interface ProofPackage {
  format: 'wortomat-proof';
  version: 1;
  /** The notes refer to this ID. */
  id: string;
  title: string;
  author: string;
  exportedAt: string;
  chapters: ProofChapter[];
  /** For the plot view on the phone; empty without threads. */
  strands: Array<Pick<Strand, 'id' | 'name' | 'color'>>;
  /** Sections of the story order, e.g. "Day 2". */
  storyMarks: Array<Pick<StoryMark, 'label' | 'position'>>;
}

export interface ProofChapter {
  id: string;
  title: string;
  /** Running number in the book (from 1). */
  number: number;
  /** `null` without a part. */
  part: string | null;
  scenes: ProofScene[];
}

export interface ProofScene {
  id: string;
  title: string;
  /** Plain text per paragraph (empty ones too, so the numbers match the book). */
  paragraphs: string[];
  /** In thread order. */
  strandIds: string[];
  turningPoint: boolean;
  /** As on the computer: `null` = follows the scene before it in the book. */
  storyOrder: number | null;
}

/** Notes from the phone back to the computer. */
export interface ProofNotesFile {
  format: 'wortomat-proof-notes';
  version: 1;
  packageId: string;
  title: string;
  exportedAt: string;
  notes: ProofNote[];
}

/**
 * The passage is found again via the marked text plus a few characters before and after – even if
 * the paragraph moved.
 */
export interface ProofNote {
  id: string;
  sceneId: string;
  /** Paragraph in the proofreading copy (from 0). */
  paragraph: number;
  quote: string;
  /** Text right before and after (in the same paragraph, at most a few dozen characters). */
  prefix: string;
  suffix: string;
  /** For suggestions, the optional reason. */
  note: string;
  /** `null` for plain notes. */
  suggestion: string | null;
  createdAt: string;
}

/** With a path (desktop) save there, otherwise as a download. */
export interface ProofExportRequest {
  filePath?: string;
}

export interface ProofInbox {
  dir: string;
  /** Newest first. */
  files: ProofInboxFile[];
  /** Each counted only once. */
  newNotes: number;
}

export interface ProofInboxFile {
  name: string;
  modifiedAt: string;
  /** Notes for this book in the file. */
  notes: number;
  /** Of those, not yet imported. */
  newNotes: number;
  /** Everything imported and nothing for other books in it – may be deleted. */
  done: boolean;
}

export interface ProofImportResult {
  applied: number;
  /** Already imported earlier – the phone always sends all notes. */
  skipped: number;
  /** Notes whose passage could no longer be found. */
  unmatched: Array<{
    note: ProofNote;
    /** `null` when the scene no longer exists. */
    sceneTitle: string | null;
  }>;
}

/** SVG is excluded on purpose (it can contain scripts). */
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | 'image/avif';

export interface ImageInfo {
  id: string;
  mimeType: ImageMimeType;
  width: number | null;
  height: number | null;
  byteSize: number;
  originalName: string | null;
  /** Relative to the app origin, e.g. `/api/images/<id>`. */
  url: string;
}

/**
 * Relative to the image size (0 … 1). The original stays unchanged; only the crop is shown, and it
 * can be chosen again at any time.
 */
export interface ImageCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GalleryImage extends ImageInfo {
  /** `null` = whole image. */
  crop: ImageCrop | null;
}

export interface SetImageCropRequest {
  crop: ImageCrop | null;
}

export interface SearchHit {
  /** Determines where a click leads. */
  kind: 'scene' | NoteKind;
  id: string;
  title: string;
  /**
   * From text or summary; hits are wrapped in <mark>…</mark>, everything else is HTML-escaped.
   * Empty when only the title matches.
   */
  snippetHtml: string;
}

export type ExportFormat = 'html' | 'docx' | 'pdf' | 'epub';

/** For Word and PDF (HTML and EPUB have a fixed layout). */
export type ExportTemplate = 'normseite' | 'roman';

/** Available for both PDF and Word. */
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
 * Type area of the "novel" template (the standard page is standardised and fixed). Measurements in
 * millimetres, font size in points. Printed two-sided: "inner" is the margin at the gutter, "outer"
 * the one at the page edge.
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

/** Stored per book in the project file. */
export interface ExportSettings {
  format: ExportFormat;
  template: ExportTemplate;
  includeSceneTitles: boolean;
  includeParts: boolean;
  layout: BookLayout;
}

export interface ExportSettingsResponse {
  settings: ExportSettings;
  /** E.g. for "Reset". */
  defaults: ExportSettings;
}

export interface BookFontInfo {
  id: BookFont;
  label: string;
  cssFamily: string;
  /** Without a matching TeX package the PDF falls back to Latin Modern. */
  pdfAvailable: boolean;
  /** Only offered when `pdfAvailable` (or already chosen). */
  optional: boolean;
}

export interface ExportPreview {
  title: string;
  author: string;
  /** First chapter with text; `null` while the book is empty. */
  chapterTitle: string | null;
  html: string;
}

export interface ExportRequest {
  format: ExportFormat;
  template: ExportTemplate;
  /** Otherwise only scene breaks. */
  includeSceneTitles: boolean;
  /**
   * Parts as pages or headings of their own. Missing means printed; without them the chapters
   * follow each other directly.
   */
  includeParts?: boolean;
  /** Missing means the defaults. */
  layout?: BookLayout;
  /**
   * Desktop: from the save dialog. Without a path the server returns the file directly as a
   * download (browser mode).
   */
  filePath?: string;
}

export interface ExportResult {
  filePath: string;
  /** E.g. images this format could not take over. */
  warnings: string[];
}

export interface ExportCapabilities {
  pdf: {
    available: boolean;
    /** e.g. "pdfTeX 3.141592653-2.6-1.40.25 (TeX Live 2023)" */
    version: string | null;
  };
  fonts: BookFontInfo[];
}

// Provided by the preload script as `window.wortomat`.

export interface DesktopBridge {
  readonly isDesktop: true;
  /** `null` = cancelled. */
  showOpenProjectDialog(): Promise<string | null>;
  /** `null` = cancelled. */
  showCreateProjectDialog(suggestedName: string): Promise<string | null>;
  /**
   * Called before the window closes or another project is opened. The window waits (with a timeout)
   * until the promise settles – time to save.
   */
  onBeforeClose(handler: () => Promise<void>): void;
  /** `null` = cancelled. */
  showExportDialog(suggestedName: string, format: ExportFormat): Promise<string | null>;
  openPath(filePath: string): Promise<void>;
  showItemInFolder(filePath: string): Promise<void>;
  /** For native menus and dialogs (context menu, "Save as" …). */
  setLanguage(language: Language): void;
  /** For window frame, menus and dialogs. */
  setTheme(theme: Theme): void;
}
