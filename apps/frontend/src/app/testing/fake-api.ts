import type {
  AppInfo,
  AppSettings,
  CreateProjectRequest,
  DesktopBridge,
  DirectoryListing,
  ExportCapabilities,
  ExportPreview,
  ExportRequest,
  ExportResult,
  ExportSettings,
  ExportSettingsResponse,
  ImageInfo,
  ProjectInfo,
  ProjectListEntry,
  ProofImportResult,
  ProofInbox,
  ProofNotesFile,
  UpdateProjectRequest,
  CreateNodeRequest,
  CreateNoteGroupRequest,
  CreateNoteRequest,
  EditorDoc,
  GalleryImage,
  ImageCrop,
  MoveNoteGroupRequest,
  NoteContent,
  PlaceMap,
  SaveDocumentRequest,
  SceneReference,
  StrandColor,
  Tag,
  TagSummary,
  UpdateNoteGroupRequest,
  UpdateNoteRequest,
  ManuscriptNode,
  MoveNodeRequest,
  NoteGroup,
  NoteSummary,
  SceneRelations,
  SearchHit,
  Strand,
  UpdateAppSettingsRequest,
  UpdateNodeRequest,
} from '@wortomat/shared';
import type { Provider } from '@angular/core';
import { WortomatApi } from '../core/wortomat-api';

export const TEST_SETTINGS: AppSettings = {
  language: 'de',
  sidebarWidth: null,
  quoteStyle: 'de',
  theme: 'system',
  fontSize: 'medium',
  revisionMode: false,
  plotView: { order: 'story', onlyTurningPoints: true, compact: false },
};

/**
 * In-memory stand-in for the REST backend. The manuscript behaves like the real one closely enough
 * for the stores built on it; everything else returns empty data. Every method is a spy, so tests
 * assert what the UI asked the backend to do rather than how the store got there. Responses are
 * copies, as over HTTP, so a store can never share an array with the fake.
 */
export class FakeApi {
  nodes: ManuscriptNode[] = [];
  notes: NoteSummary[] = [];
  noteGroups: NoteGroup[] = [];
  relations: SceneRelations[] = [];
  strands: Strand[] = [];
  hits: SearchHit[] = [];
  private nextId = 1;

  readonly settings = vi.fn(async (): Promise<AppSettings> => TEST_SETTINGS);
  readonly updateSettings = vi.fn(
    async (request: UpdateAppSettingsRequest): Promise<AppSettings> => ({
      ...TEST_SETTINGS,
      ...request,
      plotView: { ...TEST_SETTINGS.plotView, ...request.plotView },
    }),
  );

  readonly listNodes = vi.fn(async (): Promise<ManuscriptNode[]> => structuredClone(this.nodes));
  readonly createNode = vi.fn(async (request: CreateNodeRequest): Promise<ManuscriptNode> => {
    const siblings = this.nodes.filter((node) => node.parentId === request.parentId);
    const created = testNode(`neu-${this.nextId++}`, request.kind, request.parentId, {
      title: request.title,
      sortOrder: siblings.length + 1,
    });
    this.nodes.push(created);
    return structuredClone(created);
  });
  readonly updateNode = vi.fn(
    async (id: string, request: UpdateNodeRequest): Promise<ManuscriptNode> => {
      const index = this.nodes.findIndex((node) => node.id === id);
      if (index < 0) throw new Error(`unknown node ${id}`);
      this.nodes[index] = { ...this.nodes[index]!, ...request };
      return structuredClone(this.nodes[index]!);
    },
  );
  // Tests check the request; reordering itself is covered by the backend tests.
  readonly moveNode = vi.fn(
    async (_id: string, _request: MoveNodeRequest): Promise<ManuscriptNode[]> =>
      structuredClone(this.nodes),
  );
  readonly deleteNode = vi.fn(async (id: string): Promise<void> => {
    const doomed = new Set([id]);
    for (let grew = true; grew;) {
      grew = false;
      for (const node of this.nodes) {
        if (node.parentId && doomed.has(node.parentId) && !doomed.has(node.id)) {
          doomed.add(node.id);
          grew = true;
        }
      }
    }
    this.nodes = this.nodes.filter((node) => !doomed.has(node.id));
  });

  readonly listNotes = vi.fn(async (): Promise<NoteSummary[]> => structuredClone(this.notes));
  readonly listNoteGroups = vi.fn(async (): Promise<NoteGroup[]> =>
    structuredClone(this.noteGroups),
  );
  readonly sceneRelations = vi.fn(async (): Promise<SceneRelations[]> =>
    structuredClone(this.relations),
  );
  readonly listStrands = vi.fn(async (): Promise<Strand[]> => structuredClone(this.strands));
  readonly search = vi.fn(async (_query: string): Promise<SearchHit[]> =>
    structuredClone(this.hits),
  );

  project: ProjectInfo | null = null;
  projects: ProjectListEntry[] = [];
  readonly appInfo = vi.fn(async (): Promise<AppInfo> => ({
    version: '2.0.0',
    mode: 'browser',
    defaultProjectDir: '/home/test/Dokumente',
  }));
  readonly currentProject = vi.fn(async () => structuredClone(this.project));
  readonly listProjects = vi.fn(async () => structuredClone(this.projects));
  readonly forgetProject = vi.fn(async (filePath: string): Promise<void> => {
    this.projects = this.projects.filter((entry) => entry.filePath !== filePath);
  });
  readonly createProject = vi.fn(async (request: CreateProjectRequest) => {
    this.project = testProject({ filePath: request.filePath, title: request.title });
    return structuredClone(this.project);
  });
  readonly openProject = vi.fn(async (filePath: string) => {
    const entry = this.projects.find((p) => p.filePath === filePath);
    this.project = testProject({ filePath, title: entry?.title ?? 'Buch' });
    return structuredClone(this.project);
  });
  readonly closeProject = vi.fn(async (): Promise<void> => {
    this.project = null;
  });
  readonly updateProject = vi.fn(async (request: UpdateProjectRequest) => {
    this.project = { ...(this.project ?? testProject()), ...request };
    return structuredClone(this.project);
  });

  directories = new Map<string, DirectoryListing>();
  readonly listDirectory = vi.fn(async (dir?: string): Promise<DirectoryListing> => {
    const listing = this.directories.get(dir ?? '') ?? [...this.directories.values()][0];
    if (!listing) throw new Error(`no listing for ${dir}`);
    return structuredClone(listing);
  });

  readonly uploadImage = vi.fn(
    async (_image: Blob, fileName: string, width: number, height: number): Promise<ImageInfo> => {
      const id = `bild-${this.nextId++}`;
      return testImage(id, { originalName: fileName, width, height });
    },
  );

  inboxState: ProofInbox = { dir: '/home/test/Downloads', files: [], newNotes: 0 };
  importResult: ProofImportResult = { applied: 0, skipped: 0, unmatched: [] };
  readonly proofInbox = vi.fn(async () => structuredClone(this.inboxState));
  readonly importProofInbox = vi.fn(async () => structuredClone(this.importResult));
  readonly importProofNotes = vi.fn(async (_file: ProofNotesFile) =>
    structuredClone(this.importResult),
  );
  readonly cleanProofInbox = vi.fn(async () => {
    const deleted = this.inboxState.files.filter((f) => f.done).map((f) => f.name);
    this.inboxState = {
      ...this.inboxState,
      files: this.inboxState.files.filter((f) => !f.done),
    };
    return { deleted };
  });
  readonly proofCopyToFile = vi.fn(async (filePath: string): Promise<ExportResult> => ({
    filePath,
    warnings: [],
  }));
  readonly proofCopyDownload = vi.fn(async () => ({
    blob: new Blob(['<html>']),
    fileName: 'Buch – Korrekturfassung.html',
  }));

  capabilities: ExportCapabilities = {
    pdf: { available: true, version: 'pdfTeX 3.14' },
    fonts: [
      {
        id: 'palatino',
        label: 'Palatino',
        cssFamily: 'Palatino, serif',
        pdfAvailable: true,
        optional: false,
      },
      {
        id: 'garamond',
        label: 'Garamond',
        cssFamily: 'Garamond, serif',
        pdfAvailable: true,
        optional: false,
      },
      {
        id: 'computermodern',
        label: 'Computer Modern',
        cssFamily: 'serif',
        pdfAvailable: false,
        optional: true,
      },
    ],
  };
  exportState: ExportSettingsResponse = {
    settings: TEST_EXPORT_SETTINGS,
    defaults: TEST_EXPORT_SETTINGS,
  };
  readonly exportCapabilities = vi.fn(async () => structuredClone(this.capabilities));
  readonly exportSettings = vi.fn(async () => structuredClone(this.exportState));
  readonly saveExportSettings = vi.fn(async (settings: ExportSettings) => {
    this.exportState = { ...this.exportState, settings: structuredClone(settings) };
    return structuredClone(settings);
  });
  readonly exportPreview = vi.fn(async (_includeSceneTitles: boolean): Promise<ExportPreview> => ({
    title: 'Buch',
    author: '',
    chapterTitle: 'Kapitel 1',
    html: '<p>Es war einmal.</p>',
  }));
  readonly exportToFile = vi.fn(
    async (request: ExportRequest & { filePath: string }): Promise<ExportResult> => ({
      filePath: request.filePath,
      warnings: [],
    }),
  );
  readonly exportDownload = vi.fn(async (request: ExportRequest) => ({
    blob: new Blob(['x']),
    fileName: `Buch.${request.format}`,
    warnings: [] as string[],
  }));

  readonly listMaps = vi.fn(async () => []);

  readonly createNote = vi.fn(async (request: CreateNoteRequest): Promise<NoteSummary> => {
    const note = testNote(`notiz-${this.nextId++}`, request.kind, { title: request.title });
    this.notes.push(note);
    return structuredClone(note);
  });
  readonly updateNote = vi.fn(async (id: string, request: UpdateNoteRequest) => {
    const index = this.notes.findIndex((note) => note.id === id);
    if (index < 0) throw new Error(`unknown note ${id}`);
    this.notes[index] = { ...this.notes[index]!, ...request };
    return structuredClone(this.notes[index]!);
  });
  readonly deleteNote = vi.fn(async (id: string): Promise<void> => {
    this.notes = this.notes.filter((note) => note.id !== id);
  });

  readonly createNoteGroup = vi.fn(async (request: CreateNoteGroupRequest): Promise<NoteGroup> => {
    const group = { id: `gruppe-${this.nextId++}`, ...request };
    this.noteGroups.push(group);
    return { ...group };
  });
  readonly updateNoteGroup = vi.fn(async (id: string, request: UpdateNoteGroupRequest) => {
    const group = this.noteGroups.find((entry) => entry.id === id)!;
    Object.assign(group, request);
    return { ...group };
  });
  readonly moveNoteGroup = vi.fn(
    async (id: string, request: MoveNoteGroupRequest): Promise<NoteGroup[]> => {
      const moved = this.noteGroups.find((group) => group.id === id)!;
      const rest = this.noteGroups.filter((group) => group !== moved);
      const at = request.beforeId ? rest.findIndex((g) => g.id === request.beforeId) : rest.length;
      this.noteGroups = [...rest.slice(0, at), moved, ...rest.slice(at)];
      return structuredClone(this.noteGroups);
    },
  );
  readonly deleteNoteGroup = vi.fn(async (id: string): Promise<void> => {
    this.noteGroups = this.noteGroups.filter((group) => group.id !== id);
    for (const note of this.notes) if (note.groupId === id) note.groupId = null;
  });

  noteDocs = new Map<string, EditorDoc | null>();
  readonly noteContent = vi.fn(async (id: string): Promise<NoteContent> => ({
    id,
    doc: structuredClone(this.noteDocs.get(id) ?? null),
    wordCount: 0,
    annotations: { todo: 0, idea: 0, fixme: 0 },
    updatedAt: null,
  }));
  readonly saveNoteContent = vi.fn(
    async (id: string, request: SaveDocumentRequest): Promise<NoteContent> => {
      this.noteDocs.set(id, request.doc);
      return { ...(await this.noteContent(id)), wordCount: request.wordCount };
    },
  );

  images = new Map<string, GalleryImage[]>();
  private gallery = (noteId: string) => structuredClone(this.images.get(noteId) ?? []);
  readonly noteImages = vi.fn(async (noteId: string) => this.gallery(noteId));
  readonly addNoteImage = vi.fn(
    async (noteId: string, _blob: Blob, fileName: string, width: number, height: number) => {
      const id = `bild-${this.nextId++}`;
      const image = testImage(id, { originalName: fileName, width, height });
      this.images.set(noteId, [...(this.images.get(noteId) ?? []), image]);
      return this.gallery(noteId);
    },
  );
  readonly removeNoteImage = vi.fn(async (noteId: string, imageId: string) => {
    this.images.set(
      noteId,
      (this.images.get(noteId) ?? []).filter((i) => i.id !== imageId),
    );
    return this.gallery(noteId);
  });
  readonly reorderNoteImages = vi.fn(async (noteId: string, imageIds: string[]) => {
    const byId = new Map((this.images.get(noteId) ?? []).map((image) => [image.id, image]));
    this.images.set(
      noteId,
      imageIds.map((id) => byId.get(id)!),
    );
    return this.gallery(noteId);
  });
  readonly setNoteImageCrop = vi.fn(
    async (noteId: string, imageId: string, crop: ImageCrop | null) => {
      for (const image of this.images.get(noteId) ?? [])
        if (image.id === imageId) image.crop = crop;
      return this.gallery(noteId);
    },
  );

  appearances = new Map<string, SceneReference[]>();
  readonly noteScenes = vi.fn(async (noteId: string) => this.appearances.get(noteId) ?? []);
  readonly mapsWithPlace = vi.fn(async (_noteId: string): Promise<PlaceMap[]> => []);

  /** Scene → linked note IDs, tags and threads. */
  links = new Map<string, string[]>();
  sceneTagsById = new Map<string, Tag[]>();
  sceneStrandsById = new Map<string, string[]>();
  private linkedNotes = (sceneId: string) =>
    structuredClone(this.notes.filter((note) => this.links.get(sceneId)?.includes(note.id)));
  readonly sceneLinks = vi.fn(async (sceneId: string) => this.linkedNotes(sceneId));
  readonly linkNote = vi.fn(async (sceneId: string, noteId: string) => {
    const ids = this.links.get(sceneId) ?? [];
    if (!ids.includes(noteId)) this.links.set(sceneId, [...ids, noteId]);
    return this.linkedNotes(sceneId);
  });
  readonly unlinkNote = vi.fn(async (sceneId: string, noteId: string) => {
    this.links.set(
      sceneId,
      (this.links.get(sceneId) ?? []).filter((id) => id !== noteId),
    );
    return this.linkedNotes(sceneId);
  });

  readonly sceneTags = vi.fn(async (sceneId: string) => [
    ...(this.sceneTagsById.get(sceneId) ?? []),
  ]);
  readonly listTags = vi.fn(async (): Promise<TagSummary[]> => {
    const counts = new Map<string, TagSummary>();
    for (const tags of this.sceneTagsById.values()) {
      for (const tag of tags) {
        const entry = counts.get(tag.id) ?? { ...tag, sceneCount: 0 };
        entry.sceneCount++;
        counts.set(tag.id, entry);
      }
    }
    return [...counts.values()];
  });
  readonly addSceneTag = vi.fn(async (sceneId: string, name: string) => {
    const known = [...this.sceneTagsById.values()].flat().find((tag) => tag.name === name);
    const tag = known ?? { id: `tag-${this.nextId++}`, name };
    const tags = this.sceneTagsById.get(sceneId) ?? [];
    if (!tags.some((entry) => entry.id === tag.id)) this.sceneTagsById.set(sceneId, [...tags, tag]);
    return [...this.sceneTagsById.get(sceneId)!];
  });
  readonly removeSceneTag = vi.fn(async (sceneId: string, tagId: string) => {
    const tags = (this.sceneTagsById.get(sceneId) ?? []).filter((tag) => tag.id !== tagId);
    this.sceneTagsById.set(sceneId, tags);
    return [...tags];
  });

  private strandsOf = (sceneId: string) =>
    structuredClone(this.strands.filter((s) => this.sceneStrandsById.get(sceneId)?.includes(s.id)));
  readonly sceneStrands = vi.fn(async (sceneId: string) => this.strandsOf(sceneId));
  readonly createStrand = vi.fn(async (name: string, color: StrandColor = 'violet') => {
    const strand: Strand = { id: `strang-${this.nextId++}`, name, color, sceneCount: 0 };
    this.strands.push(strand);
    return { ...strand };
  });
  readonly updateStrand = vi.fn(
    async (id: string, changes: { name?: string; color?: StrandColor }): Promise<Strand> => {
      const strand = this.strands.find((entry) => entry.id === id)!;
      Object.assign(strand, changes);
      return { ...strand };
    },
  );
  readonly deleteStrand = vi.fn(async (id: string): Promise<void> => {
    this.strands = this.strands.filter((strand) => strand.id !== id);
    for (const [scene, ids] of this.sceneStrandsById) {
      this.sceneStrandsById.set(
        scene,
        ids.filter((entry) => entry !== id),
      );
    }
  });
  readonly addSceneStrand = vi.fn(async (sceneId: string, strandId: string) => {
    const ids = this.sceneStrandsById.get(sceneId) ?? [];
    if (!ids.includes(strandId)) this.sceneStrandsById.set(sceneId, [...ids, strandId]);
    return this.strandsOf(sceneId);
  });
  readonly removeSceneStrand = vi.fn(async (sceneId: string, strandId: string) => {
    const ids = (this.sceneStrandsById.get(sceneId) ?? []).filter((id) => id !== strandId);
    this.sceneStrandsById.set(sceneId, ids);
    return this.strandsOf(sceneId);
  });
}

/** A call the test did not prepare fails loudly with "… is not a function". */
export function provideFakeApi(api: FakeApi): Provider {
  return { provide: WortomatApi, useValue: api };
}

export const TEST_EXPORT_SETTINGS: ExportSettings = {
  format: 'docx',
  template: 'normseite',
  includeSceneTitles: false,
  includeParts: true,
  layout: {
    pageWidth: 125,
    pageHeight: 190,
    marginInner: 20,
    marginOuter: 15,
    marginTop: 18,
    marginBottom: 22,
    font: 'palatino',
    fontSize: 11,
  },
};

export function testProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    filePath: '/home/test/Dokumente/Buch.wortomat',
    title: 'Buch',
    author: '',
    coverImageId: null,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    ...overrides,
  };
}

/** The Electron bridge with every native dialog answering as if the user picked a file. */
export function fakeDesktop() {
  return {
    isDesktop: true as const,
    showOpenProjectDialog: vi.fn(async (): Promise<string | null> => '/home/test/Anderes.wortomat'),
    showCreateProjectDialog: vi.fn(
      async (name: string): Promise<string | null> => `/home/test/${name}.wortomat`,
    ),
    onBeforeClose: vi.fn(),
    showExportDialog: vi.fn(
      async (name: string, format: string): Promise<string | null> =>
        `/home/test/${name}.${format}`,
    ),
    openPath: vi.fn(async () => undefined),
    showItemInFolder: vi.fn(async () => undefined),
    setLanguage: vi.fn(),
    setTheme: vi.fn(),
  } satisfies DesktopBridge;
}

export function testNode(
  id: string,
  kind: ManuscriptNode['kind'],
  parentId: string | null,
  overrides: Partial<ManuscriptNode> = {},
): ManuscriptNode {
  const scene = kind === 'scene';
  return {
    id,
    kind,
    parentId,
    sortOrder: 1,
    title: id,
    wordCount: 0,
    status: scene ? 'idea' : null,
    annotations: scene ? { todo: 0, idea: 0, fixme: 0 } : null,
    turningPoint: scene ? false : null,
    storyOrder: null,
    ...overrides,
  };
}

export function testNote(
  id: string,
  kind: NoteSummary['kind'],
  overrides: Partial<NoteSummary> = {},
): NoteSummary {
  return {
    id,
    kind,
    title: id,
    summary: '',
    groupId: null,
    updatedAt: '2026-10-01T10:00:00.000Z',
    coverImageUrl: null,
    coverCrop: null,
    annotations: { todo: 0, idea: 0, fixme: 0 },
    ...overrides,
  };
}

export function testImage(id: string, overrides: Partial<GalleryImage> = {}): GalleryImage {
  return {
    id,
    mimeType: 'image/png',
    width: 1600,
    height: 1200,
    byteSize: 1000,
    originalName: `${id}.png`,
    url: `/api/images/${id}`,
    crop: null,
    ...overrides,
  };
}
