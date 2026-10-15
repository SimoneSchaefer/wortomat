import type {
  AppSettings,
  CreateNodeRequest,
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
 * assert what the UI asked the backend to do rather than how the store got there.
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
  readonly listNoteGroups = vi.fn(async (): Promise<NoteGroup[]> => this.noteGroups);
  readonly sceneRelations = vi.fn(async (): Promise<SceneRelations[]> => this.relations);
  readonly listStrands = vi.fn(async (): Promise<Strand[]> => this.strands);
  readonly search = vi.fn(async (_query: string): Promise<SearchHit[]> => this.hits);
}

/** A call the test did not prepare fails loudly with "… is not a function". */
export function provideFakeApi(api: FakeApi): Provider {
  return { provide: WortomatApi, useValue: api };
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
