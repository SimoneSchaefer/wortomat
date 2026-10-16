import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { after, before, describe, it } from 'node:test';
import type {
  AppSettings,
  DirectoryListing,
  GalleryImage,
  ImageInfo,
  ManuscriptNode,
  MapSummary,
  NoteContent,
  NoteGroup,
  NoteSummary,
  PlaceMap,
  ProofImportResult,
  ProofInbox,
  ProofPackage,
  ProjectInfo,
  ProjectListEntry,
  SceneContent,
  SceneReference,
  SceneRelations,
  SceneText,
  SearchHit,
  StoryMark,
  StoryState,
  Strand,
  Tag,
  TagSummary,
  WritingDay,
} from '@wortomat/shared';
import { AUTH_HEADER, type RunningServer, startServer } from './server.js';

const TOKEN = 'test-token';
const DEFAULT_PLOT_VIEW = {
  order: 'story',
  onlyTurningPoints: true,
  compact: false,
  vertical: false,
};
// Smallest valid PNG (1×1 pixel).
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('REST API', () => {
  let server: RunningServer;
  let tmpDir: string;

  const api = async <T>(method: string, urlPath: string, body?: unknown): Promise<T> => {
    const response = await fetch(server.url + urlPath, {
      method,
      headers: { [AUTH_HEADER]: TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    assert.ok(response.ok, `${method} ${urlPath} → ${response.status}: ${text}`);
    return (text ? JSON.parse(text) : null) as T;
  };

  before(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'wortomat-test-'));
    server = await startServer({
      mode: 'desktop',
      version: 'test',
      defaultProjectDir: tmpDir,
      dataDir: path.join(tmpDir, 'appdata'),
      downloadsDir: path.join(tmpDir, 'downloads'),
      token: TOKEN,
      logger: false,
    });
  });

  after(async () => {
    await server.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('rejects requests without a token', async () => {
    const response = await fetch(`${server.url}/api/app`);
    assert.equal(response.status, 401);
  });

  it('rejects foreign Host headers (DNS rebinding)', async () => {
    const http = await import('node:http');
    const status = await new Promise<number>((resolve, reject) => {
      http
        .get(
          `${server.url}/api/app`,
          { headers: { host: 'evil.example:80', [AUTH_HEADER]: TOKEN } },
          (res) => {
            res.resume();
            resolve(res.statusCode ?? 0);
          },
        )
        .on('error', reject);
    });
    assert.equal(status, 403);
  });

  it('responds with 409 while no project is open', async () => {
    assert.equal(await api('GET', '/api/project'), null);
    const response = await fetch(`${server.url}/api/nodes`, { headers: { [AUTH_HEADER]: TOKEN } });
    assert.equal(response.status, 409);
  });

  it('goes through project → chapter → scene → content → search → reopening', async () => {
    const filePath = path.join(tmpDir, 'Roman');
    const project = await api<ProjectInfo>('POST', '/api/project/create', {
      filePath,
      title: 'Mein Roman',
    });
    assert.equal(project.filePath, filePath + '.wortomat');

    const chapter = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'Kapitel 1',
    });
    const scene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: chapter.id,
      kind: 'scene',
      title: 'Am Fluss',
    });

    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Die Häuser am Fluss.' }] }],
    };
    // Larger than Express's default limit of 100 KB.
    const longText = 'Wort '.repeat(40_000);
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc,
      text: `Die Häuser am Fluss. ${longText}`,
      wordCount: 40_004,
    });

    const hits = await api<SearchHit[]>('GET', '/api/search?q=hauser');
    assert.equal(hits.length, 1);
    assert.equal(hits[0]!.id, scene.id);
    assert.equal(hits[0]!.kind, 'scene');
    assert.match(hits[0]!.snippetHtml, /<mark>Häuser<\/mark>/);

    await api('POST', '/api/project/close');
    await api<ProjectInfo>('POST', '/api/project/open', { filePath: project.filePath });

    const content = await api<SceneContent>('GET', `/api/scenes/${scene.id}/content`);
    assert.deepEqual(content.doc, doc);
    assert.equal(content.wordCount, 40_004);

    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.equal(nodes.find((n) => n.id === scene.id)?.wordCount, 40_004);

    await api('DELETE', `/api/nodes/${chapter.id}`);
    assert.deepEqual(await api('GET', '/api/nodes'), []);
    assert.deepEqual(await api('GET', '/api/search?q=hauser'), []);
  });

  it('moves scenes and chapters and renumbers', async () => {
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const move = (id: string, parentId: string | null, beforeId: string | null) =>
      api<ManuscriptNode[]>('POST', `/api/nodes/${id}/move`, { parentId, beforeId });
    const titlesUnder = (nodes: ManuscriptNode[], parentId: string | null) =>
      nodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((n) => n.title);

    const k1 = await node(null, 'chapter', 'K1');
    const k2 = await node(null, 'chapter', 'K2');
    const a = await node(k1.id, 'scene', 'A');
    const b = await node(k1.id, 'scene', 'B');
    const c = await node(k1.id, 'scene', 'C');

    // C before A
    let nodes = await move(c.id, k1.id, a.id);
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'A', 'B']);
    assert.deepEqual(
      nodes
        .filter((n) => n.parentId === k1.id)
        .map((n) => n.sortOrder)
        .sort(),
      [1, 2, 3],
    );

    // A to the end of K2
    nodes = await move(a.id, k2.id, null);
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'B']);
    assert.deepEqual(titlesUnder(nodes, k2.id), ['A']);

    // Reorder chapters, then move into a part (scenes move along)
    nodes = await move(k2.id, null, k1.id);
    assert.deepEqual(titlesUnder(nodes, null), ['K2', 'K1']);
    const teil = await node(null, 'part', 'Teil I');
    nodes = await move(k1.id, teil.id, null);
    assert.deepEqual(titlesUnder(nodes, teil.id), ['K1']);
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'B']);

    const rejected = async (id: string, parentId: string | null, beforeId: string | null) => {
      const response = await fetch(`${server.url}/api/nodes/${id}/move`, {
        method: 'POST',
        headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId, beforeId }),
      });
      return response.status;
    };
    assert.equal(await rejected(b.id, null, null), 400, 'scene at the top level');
    assert.equal(await rejected(teil.id, k2.id, null), 400, 'part into chapter');
    assert.equal(await rejected(b.id, k2.id, c.id), 400, 'reference element from another chapter');
    assert.equal(await rejected(k2.id, k2.id, null), 400, 'into itself');

    await api('DELETE', `/api/nodes/${teil.id}`);
    await api('DELETE', `/api/nodes/${k2.id}`);
  });

  it('arranges all scenes at once and rejects arrangements that miss the book', async () => {
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const titlesUnder = (nodes: ManuscriptNode[], parentId: string) =>
      nodes
        .filter((n) => n.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((n) => n.title);
    const k1 = await node(null, 'chapter', 'K1');
    const k2 = await node(null, 'chapter', 'K2');
    const a = await node(k1.id, 'scene', 'A');
    const b = await node(k1.id, 'scene', 'B');
    const c = await node(k2.id, 'scene', 'C');

    const nodes = await api<ManuscriptNode[]>('POST', '/api/nodes/arrange', {
      chapters: [
        { chapterId: k1.id, sceneIds: [c.id, a.id] },
        { chapterId: k2.id, sceneIds: [b.id] },
      ],
    });
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'A']);
    assert.deepEqual(titlesUnder(nodes, k2.id), ['B']);

    const status = async (chapters: unknown) =>
      (
        await fetch(`${server.url}/api/nodes/arrange`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapters }),
        })
      ).status;
    const twice = [{ chapterId: k1.id, sceneIds: [a.id, b.id, c.id, a.id] }];
    assert.equal(
      await status([{ chapterId: k1.id, sceneIds: [a.id, b.id] }]),
      400,
      'scene missing',
    );
    assert.equal(await status(twice), 400, 'scene twice');
    assert.equal(
      await status([{ chapterId: a.id, sceneIds: [a.id, b.id, c.id] }]),
      400,
      'no chapter',
    );
    assert.equal(
      await status([{ chapterId: k1.id, sceneIds: [a.id, b.id, k2.id] }]),
      400,
      'no scene',
    );
    assert.equal(await status(undefined), 400, 'nothing at all');
    // A rejected arrangement changes nothing
    const unchanged = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.deepEqual(titlesUnder(unchanged, k1.id), ['C', 'A']);

    // Moved scenes can get a todo-marked label in front, to find them in the manuscript
    const paragraph = (text: string) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    });
    await api('PUT', `/api/scenes/${a.id}/content`, {
      doc: { type: 'doc', content: [paragraph('Es regnete.')] },
      text: 'Es regnete.',
      wordCount: 2,
    });
    const todayBefore = await api<{ words: number }>('GET', '/api/writing-log/today');
    await api('POST', '/api/nodes/arrange', {
      chapters: [{ chapterId: k1.id, sceneIds: [a.id, b.id, c.id] }],
      markMoved: { sceneIds: [a.id, b.id], label: 'verschoben' },
    });
    const todo = {
      type: 'text',
      text: 'verschoben',
      marks: [{ type: 'annotation', attrs: { kind: 'todo', note: null, suggestion: null } }],
    };
    const withText = await api<SceneContent>('GET', `/api/scenes/${a.id}/content`);
    assert.deepEqual(withText.doc?.content, [
      {
        type: 'paragraph',
        content: [todo, { type: 'text', text: ' ' }, { type: 'text', text: 'Es regnete.' }],
      },
    ]);
    assert.equal(withText.wordCount, 3);
    assert.deepEqual(withText.annotations, { todo: 1, idea: 0, fixme: 0 });
    const empty = await api<SceneContent>('GET', `/api/scenes/${b.id}/content`);
    assert.deepEqual(empty.doc?.content, [{ type: 'paragraph', content: [todo] }]);
    const untouched = await api<SceneContent>('GET', `/api/scenes/${c.id}/content`);
    assert.equal(untouched.doc, null);
    const hits = await api<SearchHit[]>('GET', '/api/search?q=verschoben');
    assert.deepEqual(hits.map((hit) => hit.id).sort(), [a.id, b.id].sort());
    assert.ok((await api<SearchHit[]>('GET', '/api/search?q=regnete')).length > 0);
    // Not written by the author
    assert.deepEqual(await api('GET', '/api/writing-log/today'), todayBefore);
    const all = [{ chapterId: k1.id, sceneIds: [a.id, b.id, c.id] }];
    assert.equal(
      (
        await fetch(`${server.url}/api/nodes/arrange`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapters: all, markMoved: { sceneIds: [a.id], label: ' ' } }),
        })
      ).status,
      400,
      'empty label',
    );

    await api('DELETE', `/api/nodes/${k1.id}`);
    await api('DELETE', `/api/nodes/${k2.id}`);
  });

  it('keeps a list of all created and opened projects', async () => {
    const titles = (list: ProjectListEntry[]) => list.map((p) => p.title);
    const create = (name: string) =>
      api<ProjectInfo>('POST', '/api/project/create', {
        filePath: path.join(tmpDir, 'liste', name),
        title: name,
      });

    const erstes = await create('Erstes Buch');
    const zweites = await create('Zweites Buch');
    let list = await api<ProjectListEntry[]>('GET', '/api/projects');
    // most recently used first; the "Roman" project from the previous test comes after
    assert.deepEqual(titles(list).slice(0, 2), ['Zweites Buch', 'Erstes Buch']);
    assert.equal(list.find((p) => p.isOpen)?.title, 'Zweites Buch');

    // Opening again moves it to the front; title changes and words come fresh from the file
    await api('POST', '/api/project/open', { filePath: erstes.filePath });
    await api('PATCH', '/api/project', { title: 'Erstes Buch (neu)' });
    const chapter = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const scene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: chapter.id,
      kind: 'scene',
      title: 'S',
    });
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc: { type: 'doc' },
      text: 'eins zwei drei',
      wordCount: 3,
    });
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    assert.equal(list[0]!.title, 'Erstes Buch (neu)');
    assert.equal(list[0]!.wordCount, 3);
    assert.equal(list[0]!.isOpen, true);
    assert.equal(list[1]!.isOpen, false);
    assert.equal(list[0]!.coverImageId, null);

    // Cover: listed and retrievable even while another book is open
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(PNG_1PX)], { type: 'image/png' }), 'c.png');
    const image = (await (
      await fetch(`${server.url}/api/images`, {
        method: 'POST',
        headers: { [AUTH_HEADER]: TOKEN },
        body: form,
      })
    ).json()) as ImageInfo;
    await api('PATCH', '/api/project', { coverImageId: image.id });
    await api('POST', '/api/project/open', { filePath: zweites.filePath });
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    const withCover = list.find((p) => p.filePath === erstes.filePath)!;
    assert.equal(withCover.coverImageId, image.id);
    const coverUrl = (filePath: string) =>
      `${server.url}/api/projects/cover?filePath=${encodeURIComponent(filePath)}`;
    const coverResponse = await fetch(coverUrl(erstes.filePath), {
      headers: { [AUTH_HEADER]: TOKEN },
    });
    assert.equal(coverResponse.status, 200);
    assert.equal(coverResponse.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await coverResponse.arrayBuffer()), PNG_1PX);
    // without a cover, or for files not in the list: nothing
    for (const filePath of [zweites.filePath, path.join(tmpDir, 'fremd.wortomat')]) {
      const response = await fetch(coverUrl(filePath), { headers: { [AUTH_HEADER]: TOKEN } });
      assert.equal(response.status, 404);
    }
    await api('POST', '/api/project/open', { filePath: erstes.filePath });

    // A deleted file stays visible, but as unavailable
    await rm(zweites.filePath);
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    const missing = list.find((p) => p.filePath === zweites.filePath)!;
    assert.equal(missing.available, false);
    assert.equal(missing.title, 'Zweites Buch'); // file name as a fallback

    await api('POST', '/api/projects/forget', { filePath: zweites.filePath });
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    assert.equal(
      list.some((p) => p.filePath === zweites.filePath),
      false,
    );
  });

  it('manages characters, places and research and finds them in the search', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'notizen', 'Buch'),
      title: 'Buch',
    });
    const anna = await api<NoteSummary>('POST', '/api/notes', {
      kind: 'character',
      title: 'Anna Berger',
    });
    const hafen = await api<NoteSummary>('POST', '/api/notes', { kind: 'place', title: 'Hafen' });
    await api<NoteSummary>('POST', '/api/notes', { kind: 'research', title: 'Gezeiten' });

    assert.deepEqual(
      (await api<NoteSummary[]>('GET', '/api/notes?kind=character')).map((n) => n.title),
      ['Anna Berger'],
    );
    assert.equal((await api<NoteSummary[]>('GET', '/api/notes')).length, 3);

    // Findable by title right after creation
    let hits = await api<SearchHit[]>('GET', '/api/search?q=berger');
    assert.deepEqual(
      hits.map((h) => [h.kind, h.id]),
      [['character', anna.id]],
    );

    const updated = await api<NoteSummary>('PATCH', `/api/notes/${anna.id}`, {
      summary: 'Protagonistin, 34, Ärztin',
    });
    assert.equal(updated.title, 'Anna Berger');
    assert.equal(updated.summary, 'Protagonistin, 34, Ärztin');
    assert.equal(updated.groupId, null);

    // Groups: exist even when empty, can be renamed; deleting keeps the notes
    const family = await api<NoteGroup>('POST', '/api/note-groups', {
      kind: 'character',
      name: '  Familie Berger ',
    });
    assert.equal(family.name, 'Familie Berger');
    const grouped = await api<NoteSummary>('PATCH', `/api/notes/${anna.id}`, {
      groupId: family.id,
    });
    assert.equal(grouped.groupId, family.id);
    assert.equal(grouped.summary, 'Protagonistin, 34, Ärztin'); // unchanged
    const places = await api<NoteGroup>('POST', '/api/note-groups', {
      kind: 'place',
      name: 'Küste',
    });
    const wrongKind = await fetch(`${server.url}/api/notes/${anna.id}`, {
      method: 'PATCH',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: places.id }),
    });
    assert.equal(wrongKind.status, 400);
    await api('PATCH', `/api/note-groups/${family.id}`, { name: 'Die Bergers' });
    assert.deepEqual(
      (await api<NoteGroup[]>('GET', '/api/note-groups')).map((g) => [g.kind, g.name]),
      [
        ['character', 'Die Bergers'],
        ['place', 'Küste'],
      ],
    );

    // New groups go to the end; moving only reorders within the kind
    const police = await api<NoteGroup>('POST', '/api/note-groups', {
      kind: 'character',
      name: 'Polizei',
    });
    const characterGroups = (groups: NoteGroup[]) =>
      groups.filter((g) => g.kind === 'character').map((g) => g.name);
    assert.deepEqual(characterGroups(await api('GET', '/api/note-groups')), [
      'Die Bergers',
      'Polizei',
    ]);
    let moved = await api<NoteGroup[]>('POST', `/api/note-groups/${police.id}/move`, {
      beforeId: family.id,
    });
    assert.deepEqual(characterGroups(moved), ['Polizei', 'Die Bergers']);
    moved = await api<NoteGroup[]>('POST', `/api/note-groups/${police.id}/move`, {
      beforeId: null,
    });
    assert.deepEqual(characterGroups(moved), ['Die Bergers', 'Polizei']);
    const crossKind = await fetch(`${server.url}/api/note-groups/${police.id}/move`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ beforeId: places.id }),
    });
    assert.equal(crossKind.status, 400);
    await api('DELETE', `/api/note-groups/${family.id}`);
    assert.equal(
      (await api<NoteSummary[]>('GET', '/api/notes')).find((n) => n.id === anna.id)!.groupId,
      null,
    );

    const todo = { type: 'annotation', attrs: { kind: 'todo' } };
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Fischkutter liegen am Kai.', marks: [todo] }],
        },
      ],
    };
    const saved = await api<NoteContent>('PUT', `/api/notes/${hafen.id}/content`, {
      doc,
      text: 'Fischkutter liegen am Kai.',
      wordCount: 4,
    });
    assert.deepEqual(saved.annotations, { todo: 1, idea: 0, fixme: 0 });
    const content = await api<NoteContent>('GET', `/api/notes/${hafen.id}/content`);
    assert.deepEqual(content.doc, doc);
    assert.equal(content.wordCount, 4);
    assert.deepEqual(content.annotations, { todo: 1, idea: 0, fixme: 0 });
    // in the list too, so the sidebar can show the counts
    assert.deepEqual(
      (await api<NoteSummary[]>('GET', '/api/notes')).find((n) => n.id === hafen.id)!.annotations,
      { todo: 1, idea: 0, fixme: 0 },
    );

    // Summary and text are searchable
    hits = await api<SearchHit[]>('GET', '/api/search?q=arztin');
    assert.equal(hits[0]?.id, anna.id);
    assert.match(hits[0]!.snippetHtml, /<mark>Ärztin<\/mark>/); // from the summary
    hits = await api<SearchHit[]>('GET', '/api/search?q=berger');
    assert.equal(hits[0]?.snippetHtml, ''); // only the title matches → no duplicate snippet
    hits = await api<SearchHit[]>('GET', '/api/search?q=fischkutter');
    assert.deepEqual(
      hits.map((h) => [h.kind, h.id]),
      [['place', hafen.id]],
    );
    assert.match(hits[0]!.snippetHtml, /<mark>Fischkutter<\/mark>/);

    await api('DELETE', `/api/notes/${hafen.id}`);
    assert.deepEqual(await api('GET', '/api/search?q=fischkutter'), []);

    const invalid = await fetch(`${server.url}/api/notes`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'monster', title: 'X' }),
    });
    assert.equal(invalid.status, 400);
  });

  it('manages an image gallery per character and cleans up unused images', async () => {
    const upload = async (noteId: string, name: string) => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(PNG_1PX)], { type: 'image/png' }), name);
      const response = await fetch(`${server.url}/api/notes/${noteId}/images`, {
        method: 'POST',
        headers: { [AUTH_HEADER]: TOKEN },
        body: form,
      });
      assert.equal(response.status, 201);
      return (await response.json()) as ImageInfo[];
    };
    const imageExists = async (url: string) =>
      (await fetch(server.url + url, { headers: { [AUTH_HEADER]: TOKEN } })).status === 200;
    const cover = async (noteId: string) =>
      (await api<NoteSummary[]>('GET', '/api/notes')).find((n) => n.id === noteId)!.coverImageUrl;

    const ben = await api<NoteSummary>('POST', '/api/notes', { kind: 'character', title: 'Ben' });
    assert.equal(ben.coverImageUrl, null);
    assert.deepEqual(await api('GET', `/api/notes/${ben.id}/images`), []);

    await upload(ben.id, 'eins.png');
    await upload(ben.id, 'zwei.png');
    const gallery = await upload(ben.id, 'drei.png');
    assert.deepEqual(
      gallery.map((image) => image.originalName),
      ['eins.png', 'zwei.png', 'drei.png'],
    );
    const [eins, zwei, drei] = gallery as [ImageInfo, ImageInfo, ImageInfo];
    assert.equal(await cover(ben.id), eins.url);

    // "As profile picture": three to the front
    const reordered = await api<ImageInfo[]>('PUT', `/api/notes/${ben.id}/images`, {
      imageIds: [drei.id, eins.id, zwei.id],
    });
    assert.deepEqual(
      reordered.map((image) => image.id),
      [drei.id, eins.id, zwei.id],
    );
    assert.equal(await cover(ben.id), drei.url);
    const badOrder = await fetch(`${server.url}/api/notes/${ben.id}/images`, {
      method: 'PUT',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageIds: [drei.id, eins.id] }),
    });
    assert.equal(badOrder.status, 400);

    // Choosing a crop: applies in the gallery and to the profile picture in the lists
    const cropUrl = (imageId: string) => `/api/notes/${ben.id}/images/${imageId}/crop`;
    const crop = { x: 0.1, y: 0.2, width: 0.5, height: 0.375 };
    const cropped = await api<GalleryImage[]>('PUT', cropUrl(drei.id), { crop });
    assert.deepEqual(cropped[0]!.crop, crop);
    assert.equal(cropped[1]!.crop, null);
    const coverCrop = async () =>
      (await api<NoteSummary[]>('GET', '/api/notes')).find((n) => n.id === ben.id)!.coverCrop;
    assert.deepEqual(await coverCrop(), crop);
    const cropStatus = async (imageId: string, body: unknown) =>
      (
        await fetch(server.url + cropUrl(imageId), {
          method: 'PUT',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(
      await cropStatus(drei.id, { crop: { x: 0.8, y: 0, width: 0.5, height: 0.5 } }),
      400,
    );
    assert.equal(await cropStatus(drei.id, { crop: 'mitte' }), 400);
    assert.equal(await cropStatus('gibts-nicht', { crop }), 404);
    // The original stays: "whole image" resets the crop
    const reset = await api<GalleryImage[]>('PUT', cropUrl(drei.id), { crop: null });
    assert.equal(reset[0]!.crop, null);
    assert.equal(await coverCrop(), null);

    // Removing deletes the image from the file …
    await api('DELETE', `/api/notes/${ben.id}/images/${drei.id}`);
    assert.equal(await imageExists(drei.url), false);
    assert.equal(await cover(ben.id), eins.url);

    // … unless it is still used in the text
    await api('PUT', `/api/notes/${ben.id}/content`, {
      doc: { type: 'doc', content: [{ type: 'image', attrs: { src: zwei.url } }] },
      text: '',
      wordCount: 0,
    });
    await api('DELETE', `/api/notes/${ben.id}/images/${zwei.id}`);
    assert.equal(await imageExists(zwei.url), true);

    // Deleting the note cleans up its gallery too
    await api('DELETE', `/api/notes/${ben.id}`);
    assert.equal(await imageExists(eins.url), false);
  });

  it('links scenes with characters and places – in both directions', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'links', 'Buch'),
      title: 'Buch',
    });
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const note = (kind: string, title: string) =>
      api<NoteSummary>('POST', '/api/notes', { kind, title });
    const linked = (sceneId: string) =>
      api<NoteSummary[]>('GET', `/api/scenes/${sceneId}/links`).then((notes) =>
        notes.map((n) => n.title).sort(),
      );
    const appearances = (noteId: string) =>
      api<SceneReference[]>('GET', `/api/notes/${noteId}/scenes`);

    const teil = await node(null, 'part', 'Teil I');
    const k1 = await node(teil.id, 'chapter', 'Kapitel 1');
    const k2 = await node(null, 'chapter', 'Kapitel 2');
    const ankunft = await node(k1.id, 'scene', 'Ankunft');
    const abschied = await node(k2.id, 'scene', 'Abschied');
    const markt = await node(k1.id, 'scene', 'Markt');
    const anna = await note('character', 'Anna');
    const hafen = await note('place', 'Hafen');

    // Scene → notes
    await api('POST', `/api/scenes/${abschied.id}/links`, { noteId: anna.id });
    await api('POST', `/api/scenes/${ankunft.id}/links`, { noteId: anna.id });
    await api('POST', `/api/scenes/${ankunft.id}/links`, { noteId: hafen.id });
    await api('POST', `/api/scenes/${ankunft.id}/links`, { noteId: hafen.id }); // twice: no harm
    await api('POST', `/api/scenes/${markt.id}/links`, { noteId: anna.id });
    assert.deepEqual(await linked(ankunft.id), ['Anna', 'Hafen']);

    // Note → scenes, in manuscript order with path
    assert.deepEqual(await appearances(anna.id), [
      { id: ankunft.id, title: 'Ankunft', path: ['Teil I', 'Kapitel 1'] },
      { id: markt.id, title: 'Markt', path: ['Teil I', 'Kapitel 1'] },
      { id: abschied.id, title: 'Abschied', path: ['Kapitel 2'] },
    ]);
    // Reordering affects the order
    await api('POST', `/api/nodes/${k2.id}/move`, { parentId: null, beforeId: teil.id });
    assert.deepEqual(
      (await appearances(anna.id)).map((s) => s.title),
      ['Abschied', 'Ankunft', 'Markt'],
    );

    // Unlinking
    const afterUnlink = await api<NoteSummary[]>(
      'DELETE',
      `/api/scenes/${ankunft.id}/links/${hafen.id}`,
    );
    assert.deepEqual(
      afterUnlink.map((n) => n.title),
      ['Anna'],
    );

    // Invalid targets
    const status = async (sceneId: string, noteId: string) =>
      (
        await fetch(`${server.url}/api/scenes/${sceneId}/links`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ noteId }),
        })
      ).status;
    assert.equal(await status(k1.id, anna.id), 400, 'chapter instead of scene');
    assert.equal(await status(ankunft.id, 'gibt-es-nicht'), 404, 'unknown note');

    // Deleting cleans up links: scene, whole chapter, note
    await api('DELETE', `/api/nodes/${markt.id}`);
    await api('DELETE', `/api/nodes/${k2.id}`);
    assert.deepEqual(
      (await appearances(anna.id)).map((s) => s.title),
      ['Ankunft'],
    );
    await api('DELETE', `/api/notes/${anna.id}`);
    assert.deepEqual(await linked(ankunft.id), []);
  });

  it('draws maps and places places on them', async () => {
    const status = async (method: string, urlPath: string, body: unknown) =>
      (
        await fetch(server.url + urlPath, {
          method,
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;

    const map = await api<PlaceMap>('POST', '/api/maps', { name: ' Nordküste ' });
    assert.equal(map.name, 'Nordküste');
    assert.deepEqual([map.width, map.height, map.strokes, map.pins], [1600, 1000, [], []]);
    assert.ok((await api<MapSummary[]>('GET', '/api/maps')).some((m) => m.id === map.id));

    const hafen = await api<NoteSummary>('POST', '/api/notes', { kind: 'place', title: 'Hafen' });
    const leuchtturm = await api<NoteSummary>('POST', '/api/notes', {
      kind: 'place',
      title: 'Leuchtturm',
    });
    const anna = await api<NoteSummary>('POST', '/api/notes', { kind: 'character', title: 'A' });

    const updated = await api<PlaceMap>('PATCH', `/api/maps/${map.id}`, {
      strokes: [{ tool: 'pen', color: '#3A7BD5', width: 4, points: [10.123, 20, 30, 40.06] }],
      pins: [
        { noteId: hafen.id, x: 100, y: 200 },
        { noteId: leuchtturm.id, x: 300, y: 50 },
        // not places: skipped
        { noteId: anna.id, x: 1, y: 1 },
        { noteId: 'gibt-es-nicht', x: 1, y: 1 },
      ],
    });
    assert.deepEqual(updated.strokes, [
      { tool: 'pen', color: '#3a7bd5', width: 4, points: [10.1, 20, 30, 40.1] },
    ]);
    assert.deepEqual(
      updated.pins.map((pin) => pin.noteId),
      [hafen.id, leuchtturm.id],
    );

    // Only the name changes – drawing and places stay
    const renamed = await api<PlaceMap>('PATCH', `/api/maps/${map.id}`, { name: 'Küste' });
    assert.equal(renamed.name, 'Küste');
    assert.equal(renamed.strokes.length, 1);
    assert.equal(renamed.pins.length, 2);

    assert.equal(await status('PATCH', `/api/maps/${map.id}`, { strokes: [{ tool: 'x' }] }), 400);
    assert.equal(
      await status('PATCH', `/api/maps/${map.id}`, {
        strokes: [{ tool: 'pen', color: 'red', width: 1, points: [0, 0] }],
      }),
      400,
    );
    assert.equal(await status('PATCH', `/api/maps/${map.id}`, { name: ' ' }), 400);

    // The place's page shows which maps it is on
    const stadt = await api<PlaceMap>('POST', '/api/maps', { name: 'Stadt' });
    await api('PATCH', `/api/maps/${stadt.id}`, { pins: [{ noteId: hafen.id, x: 5, y: 6 }] });
    assert.deepEqual(
      (await api<PlaceMap[]>('GET', `/api/notes/${hafen.id}/maps`)).map((m) => m.name),
      ['Küste', 'Stadt'],
    );
    await api('DELETE', `/api/maps/${stadt.id}`);
    assert.deepEqual(await api('GET', `/api/notes/${anna.id}/maps`), []);

    // Place deleted → disappears from the map
    await api('DELETE', `/api/notes/${leuchtturm.id}`);
    const after = await api<PlaceMap>('GET', `/api/maps/${map.id}`);
    assert.deepEqual(after.pins, [{ noteId: hafen.id, x: 100, y: 200 }]);

    // Background image: replacing it or deleting the map cleans up the old one
    const uploadImage = async () => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(PNG_1PX)], { type: 'image/png' }), 'k.png');
      const response = await fetch(`${server.url}/api/images`, {
        method: 'POST',
        headers: { [AUTH_HEADER]: TOKEN },
        body: form,
      });
      return (await response.json()) as ImageInfo;
    };
    const imageExists = async (url: string) =>
      (await fetch(server.url + url, { headers: { [AUTH_HEADER]: TOKEN } })).status === 200;
    const first = await uploadImage();
    const second = await uploadImage();
    await api('PATCH', `/api/maps/${map.id}`, { backgroundImageId: first.id, height: 800 });
    assert.equal(
      await status('PATCH', `/api/maps/${map.id}`, { backgroundImageId: 'unbekannt' }),
      400,
    );
    const replaced = await api<PlaceMap>('PATCH', `/api/maps/${map.id}`, {
      backgroundImageId: second.id,
      backgroundOpacity: 0.01,
    });
    assert.equal(replaced.backgroundImageId, second.id);
    assert.equal(replaced.backgroundOpacity, 0.1);
    assert.equal(replaced.height, 800);
    assert.equal(await imageExists(first.url), false);

    await api('DELETE', `/api/maps/${map.id}`);
    assert.equal(await imageExists(second.url), false);
    assert.ok(!(await api<MapSummary[]>('GET', '/api/maps')).some((m) => m.id === map.id));
  });

  it('counts todo/idea/fixme marks on save and shows them in the tree', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'markierungen', 'Buch'),
      title: 'Buch',
    });
    const kapitel = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const szene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: kapitel.id,
      kind: 'scene',
      title: 'S',
    });
    assert.deepEqual(szene.annotations, { todo: 0, idea: 0, fixme: 0 });
    assert.equal(kapitel.annotations, null);

    const mark = (kind: string) => ({ type: 'annotation', attrs: { kind } });
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Recherche ', marks: [mark('todo')] },
            { type: 'text', text: 'Hafen', marks: [mark('todo'), { type: 'bold' }] },
            { type: 'text', text: ' und ' },
            { type: 'text', text: 'Möwe?', marks: [mark('idea')] },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Satz holpert', marks: [mark('fixme')] }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Datum prüfen', marks: [mark('todo')] }],
        },
      ],
    };
    // The client's numbers are ignored – the backend counts itself.
    const saved = await api<SceneContent>('PUT', `/api/scenes/${szene.id}/content`, {
      doc,
      text: '',
      wordCount: 9,
      annotations: { todo: 99, idea: 99, fixme: 99 },
    });
    assert.deepEqual(saved.annotations, { todo: 2, idea: 1, fixme: 1 });

    const loaded = await api<SceneContent>('GET', `/api/scenes/${szene.id}/content`);
    assert.deepEqual(loaded.annotations, { todo: 2, idea: 1, fixme: 1 });
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.deepEqual(nodes.find((n) => n.id === szene.id)?.annotations, {
      todo: 2,
      idea: 1,
      fixme: 1,
    });
  });

  it('keeps a writing log: gross words written, pasted ones separately', async () => {
    await api<ProjectInfo>('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'Schreiblog'),
      title: 'Schreiblog',
    });
    const chapter = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const scene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: chapter.id,
      kind: 'scene',
      title: 'S',
    });
    const save = (text: string, pastedWords = 0) =>
      api('PUT', `/api/scenes/${scene.id}/content`, {
        doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
        text,
        wordCount: text.split(/\s+/).filter(Boolean).length,
        pastedWords,
      });

    await save('Es war einmal ein alter König.'); // 6 written
    await save('Es war einmal ein junger König.'); // 1 replaced
    await save('Es war einmal ein junger König. Aus dem alten Entwurf kopiert.', 5);

    const days = await api<WritingDay[]>('GET', '/api/writing-log');
    assert.equal(days.length, 1);
    assert.deepEqual(
      { added: days[0]!.added, removed: days[0]!.removed, pasted: days[0]!.pasted },
      { added: 7, removed: 1, pasted: 5 },
    );
    assert.deepEqual(await api('GET', '/api/writing-log?from=2000-01-01&to=2000-12-31'), []);
    assert.deepEqual(await api('GET', '/api/writing-log/today'), days[0]);

    // The history stays even when the scene is deleted
    await api('DELETE', `/api/nodes/${chapter.id}`);
    assert.equal((await api<WritingDay[]>('GET', '/api/writing-log')).length, 1);
    await api('POST', '/api/project/close');
  });

  it('returns the plain text of all scenes', async () => {
    await api<ProjectInfo>('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'Szenentexte'),
      title: 'Szenentexte',
    });
    const chapter = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const scene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: chapter.id,
      kind: 'scene',
      title: 'S',
    });
    const text = '„Komm her“, sagte Anna.\nDer Fluss rauschte.';
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
      text,
      wordCount: 7,
    });
    assert.deepEqual(await api<SceneText[]>('GET', '/api/scene-texts'), [
      { sceneId: scene.id, text },
    ]);
    await api('POST', '/api/project/close');
  });

  it('keeps a status per scene', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'status', 'Buch'),
      title: 'Buch',
    });
    const kapitel = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const szene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: kapitel.id,
      kind: 'scene',
      title: 'S',
    });
    assert.equal(szene.status, 'idea'); // new scenes start as idea
    assert.equal(kapitel.status, null); // chapters have no status

    const updated = await api<ManuscriptNode>('PATCH', `/api/nodes/${szene.id}`, {
      status: 'revised',
    });
    assert.equal(updated.status, 'revised');
    assert.equal(updated.title, 'S');
    // Renaming leaves the status alone
    await api('PATCH', `/api/nodes/${szene.id}`, { title: 'S neu' });
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.deepEqual(
      nodes.map((n) => [n.title, n.status]),
      [
        ['K', null],
        ['S neu', 'revised'],
      ],
    );

    const status = async (id: string, body: unknown) =>
      (
        await fetch(`${server.url}/api/nodes/${id}`, {
          method: 'PATCH',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(await status(szene.id, { status: 'fast fertig' }), 400);
    assert.equal(await status(kapitel.id, { status: 'final' }), 400);
  });

  it('assigns tags to scenes, reuses them and cleans up unused ones', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'tags', 'Buch'),
      title: 'Buch',
    });
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const addTag = (sceneId: string, name: string) =>
      api<Tag[]>('POST', `/api/scenes/${sceneId}/tags`, { name });
    const names = (tags: Tag[]) => tags.map((t) => t.name);
    const allTags = () => api<TagSummary[]>('GET', '/api/tags');

    const kapitel = await node(null, 'chapter', 'K');
    const s1 = await node(kapitel.id, 'scene', 'S1');
    const s2 = await node(kapitel.id, 'scene', 'S2');

    assert.deepEqual(names(await addTag(s1.id, '  Rückblende ')), ['Rückblende']);
    await addTag(s1.id, 'Spannung');
    // Same tag despite different spelling (umlauts too) and with "#"
    assert.deepEqual(names(await addTag(s2.id, '#RÜCKBLENDE')), ['Rückblende']);
    assert.deepEqual(names(await addTag(s1.id, 'rückblende')), ['Rückblende', 'Spannung']);
    await addTag(s2.id, 'Arc  Anna'); // whitespace is collapsed

    assert.deepEqual(await allTags().then((t) => t.map((x) => [x.name, x.sceneCount])), [
      ['Arc Anna', 1],
      ['Rückblende', 2],
      ['Spannung', 1],
    ]);

    // Everything at once for the scene filter: tags (alphabetical) and linked notes
    const anna = await api<NoteSummary>('POST', '/api/notes', { kind: 'character', title: 'Anna' });
    await api('POST', `/api/scenes/${s2.id}/links`, { noteId: anna.id });
    const relations = await api<SceneRelations[]>('GET', '/api/scene-relations');
    assert.deepEqual(
      relations
        .map((r) => [r.sceneId, r.noteIds, names(r.tags)])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
      [
        [s1.id, [], ['Rückblende', 'Spannung']],
        [s2.id, [anna.id], ['Arc Anna', 'Rückblende']],
      ].sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
    );

    // Removing; the last use of a tag makes it disappear
    const spannung = (await allTags()).find((t) => t.name === 'Spannung')!;
    assert.deepEqual(
      names(await api<Tag[]>('DELETE', `/api/scenes/${s1.id}/tags/${spannung.id}`)),
      ['Rückblende'],
    );
    assert.equal(
      (await allTags()).some((t) => t.name === 'Spannung'),
      false,
    );

    // Deleting a scene: its tags no longer show up as suggestions
    await api('DELETE', `/api/nodes/${s2.id}`);
    assert.deepEqual(await allTags().then((t) => t.map((x) => [x.name, x.sceneCount])), [
      ['Rückblende', 1],
    ]);

    const invalid = async (name: string) =>
      (
        await fetch(`${server.url}/api/scenes/${s1.id}/tags`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
      ).status;
    assert.equal(await invalid('  # '), 400);
    assert.equal(await invalid('x'.repeat(41)), 400);
  });

  it('assigns scenes to plot threads – new scenes start without a thread', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'straenge', 'Buch'),
      title: 'Buch',
    });
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const strandsOf = async (sceneId: string) =>
      (await api<Strand[]>('GET', `/api/scenes/${sceneId}/strands`)).map((s) => s.name);
    const status = async (method: string, urlPath: string, body: unknown) =>
      (
        await fetch(server.url + urlPath, {
          method,
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;

    // Colours are assigned in turn as long as none is chosen
    const lena = await api<Strand>('POST', '/api/strands', { name: '  Lena ' });
    const tom = await api<Strand>('POST', '/api/strands', { name: 'Tom' });
    assert.deepEqual([lena.name, lena.color, tom.color], ['Lena', 'violet', 'teal']);

    const k1 = await node(null, 'chapter', 'K1');
    const s1 = await node(k1.id, 'scene', 'S1');
    assert.deepEqual(await strandsOf(s1.id), []);
    await api('POST', `/api/scenes/${s1.id}/strands`, { strandId: lena.id });
    // New scenes take over nothing from the scene before
    const s2 = await node(k1.id, 'scene', 'S2');
    assert.deepEqual(await strandsOf(s2.id), []);
    // Merging: one scene in two threads, sorted by thread order
    await api('POST', `/api/scenes/${s2.id}/strands`, { strandId: tom.id });
    await api('POST', `/api/scenes/${s2.id}/strands`, { strandId: lena.id });
    assert.deepEqual(await strandsOf(s2.id), ['Lena', 'Tom']);

    const k2 = await node(null, 'chapter', 'K2');
    const s3 = await node(k2.id, 'scene', 'S3');
    assert.deepEqual(await strandsOf(s3.id), []);
    await api('POST', `/api/scenes/${s3.id}/strands`, { strandId: lena.id });
    await api('POST', `/api/scenes/${s3.id}/strands`, { strandId: tom.id });
    await api('DELETE', `/api/scenes/${s3.id}/strands/${lena.id}`);
    assert.deepEqual(await strandsOf(s3.id), ['Tom']);

    assert.deepEqual(
      (await api<Strand[]>('GET', '/api/strands')).map((s) => [s.name, s.sceneCount]),
      [
        ['Lena', 2],
        ['Tom', 2],
      ],
    );
    const relations = await api<SceneRelations[]>('GET', '/api/scene-relations');
    assert.deepEqual(relations.find((r) => r.sceneId === s2.id)?.strandIds, [lena.id, tom.id]);

    // Rename and recolour
    const renamed = await api<Strand>('PATCH', `/api/strands/${tom.id}`, {
      name: 'Toms Flucht',
      color: 'amber',
    });
    assert.deepEqual(
      [renamed.name, renamed.color, renamed.sceneCount],
      ['Toms Flucht', 'amber', 2],
    );
    assert.equal(await status('PATCH', `/api/strands/${tom.id}`, { color: 'pink' }), 400);
    assert.equal(await status('POST', '/api/strands', { name: ' ' }), 400);
    assert.equal(
      await status('POST', `/api/scenes/${s1.id}/strands`, { strandId: 'gibts-nicht' }),
      404,
    );
    assert.equal(await status('POST', `/api/scenes/${k1.id}/strands`, { strandId: lena.id }), 400);

    // Change the order of the rows
    const ermittlung = await api<Strand>('POST', '/api/strands', { name: 'Ermittlung' });
    const names = (strands: Strand[]) => strands.map((s) => s.name);
    assert.deepEqual(
      names(
        await api<Strand[]>('POST', `/api/strands/${ermittlung.id}/move`, { beforeId: lena.id }),
      ),
      ['Ermittlung', 'Lena', 'Toms Flucht'],
    );
    assert.deepEqual(
      names(await api<Strand[]>('POST', `/api/strands/${ermittlung.id}/move`, { beforeId: null })),
      ['Lena', 'Toms Flucht', 'Ermittlung'],
    );
    assert.equal(await status('POST', `/api/strands/${lena.id}/move`, { beforeId: lena.id }), 400);
    assert.equal(await status('POST', `/api/strands/${lena.id}/move`, { beforeId: 'weg' }), 404);
    await api('DELETE', `/api/strands/${ermittlung.id}`);

    // A thread without scenes stays; it is only deleted explicitly
    await api('DELETE', `/api/scenes/${s1.id}/strands/${lena.id}`);
    await api('DELETE', `/api/scenes/${s2.id}/strands/${lena.id}`);
    assert.deepEqual(
      (await api<Strand[]>('GET', '/api/strands')).map((s) => [s.name, s.sceneCount]),
      [
        ['Lena', 0],
        ['Toms Flucht', 2],
      ],
    );
    await api('DELETE', `/api/strands/${tom.id}`);
    assert.deepEqual(await strandsOf(s2.id), []);
    assert.deepEqual(
      (await api<Strand[]>('GET', '/api/strands')).map((s) => s.name),
      ['Lena'],
    );
  });

  it('marks scenes as turning points', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'wendepunkte', 'Buch'),
      title: 'Buch',
    });
    const kapitel = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const szene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: kapitel.id,
      kind: 'scene',
      title: 'S',
    });
    assert.equal(szene.turningPoint, false);
    assert.equal(kapitel.turningPoint, null);

    const marked = await api<ManuscriptNode>('PATCH', `/api/nodes/${szene.id}`, {
      turningPoint: true,
    });
    assert.deepEqual([marked.turningPoint, marked.status, marked.title], [true, 'idea', 'S']);
    // Changing the status leaves the turning point alone
    await api('PATCH', `/api/nodes/${szene.id}`, { status: 'draft' });
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.equal(nodes.find((n) => n.id === szene.id)?.turningPoint, true);

    const status = async (id: string, body: unknown) =>
      (
        await fetch(`${server.url}/api/nodes/${id}`, {
          method: 'PATCH',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(await status(kapitel.id, { turningPoint: true }), 400);
    assert.equal(await status(szene.id, { turningPoint: 'ja' }), 400);
  });

  it('sets the story order including sections and resets it', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'handlung', 'Buch'),
      title: 'Buch',
    });
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const k = await node(null, 'chapter', 'K');
    const [a, b, c] = [
      await node(k.id, 'scene', 'A'),
      await node(k.id, 'scene', 'B'),
      await node(k.id, 'scene', 'C'),
    ];
    assert.equal(a.storyOrder, null); // not set: as in the book
    assert.equal(k.storyOrder, null);
    const order = (nodes: ManuscriptNode[]) =>
      nodes.filter((n) => n.kind === 'scene').map((n) => [n.title, n.storyOrder]);

    // C happens first, A and B at the same time afterwards; "day 2" starts before A/B
    const saved = await api<StoryState>('PUT', '/api/story', {
      columns: [[c.id], [a.id, b.id]],
      marks: [
        { label: ' Tag  1 ', beforeColumn: 0 },
        { label: 'Tag 2', beforeColumn: 1 },
      ],
    });
    assert.deepEqual(order(saved.nodes), [
      ['A', 2],
      ['B', 2],
      ['C', 1],
    ]);
    assert.deepEqual(
      saved.marks.map((m) => [m.label, m.position]),
      [
        ['Tag 1', 1],
        ['Tag 2', 2],
      ],
    );

    // New scenes have no position yet; marks keep their ID when renamed
    const d = await node(k.id, 'scene', 'D');
    assert.equal(d.storyOrder, null);
    const tag2 = saved.marks[1]!;
    const renamed = await api<StoryState>('PUT', '/api/story', {
      columns: [[a.id], [b.id], [c.id]],
      marks: [{ id: tag2.id, label: 'Am nächsten Morgen', beforeColumn: 2 }],
    });
    assert.deepEqual(
      renamed.marks.map((m) => [m.id, m.label, m.position]),
      [[tag2.id, 'Am nächsten Morgen', 3]],
    );
    assert.deepEqual(await api<StoryMark[]>('GET', '/api/story/marks'), renamed.marks);
    assert.equal(renamed.nodes.find((n) => n.id === d.id)?.storyOrder, null);

    // Reset: everything as in the book again, marks gone
    const reset = await api<StoryState>('PUT', '/api/story', { columns: [], marks: [] });
    assert.ok(reset.nodes.every((n) => n.storyOrder === null));
    assert.deepEqual(reset.marks, []);

    const status = async (body: unknown) =>
      (
        await fetch(`${server.url}/api/story`, {
          method: 'PUT',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(await status({ columns: [[a.id], [a.id]], marks: [] }), 400); // duplicate
    assert.equal(await status({ columns: [[k.id]], marks: [] }), 400); // not a scene
    assert.equal(await status({ columns: [[]], marks: [] }), 400);
    assert.equal(
      await status({ columns: [[a.id]], marks: [{ label: 'X', beforeColumn: 1 }] }),
      400,
    );
    assert.equal(
      await status({ columns: [[a.id]], marks: [{ label: ' ', beforeColumn: 0 }] }),
      400,
    );
  });

  it('exports a proofreading copy and imports notes as fixme marks', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'korrektur', 'Buch'),
      title: 'Korrekturbuch',
    });
    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const teil = await node(null, 'part', 'Teil Eins');
    const kapitel = await node(teil.id, 'chapter', 'Ankunft');
    const szene = await node(kapitel.id, 'scene', 'Am Bahnhof');
    const leer = await node(kapitel.id, 'scene', 'Noch leer');
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Lena wartete am Bahnhof.' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Der Zug kam ' },
            { type: 'text', text: 'zu spät', marks: [{ type: 'italic' }] },
            { type: 'text', text: '.' },
          ],
        },
      ],
    };
    await api('PUT', `/api/scenes/${szene.id}/content`, {
      doc,
      text: 'Lena wartete am Bahnhof.\nDer Zug kam zu spät.',
      wordCount: 9,
    });
    // For the plot view on the phone
    const lena = await api<{ id: string }>('POST', '/api/strands', { name: 'Lena', color: 'teal' });
    await api('POST', `/api/scenes/${szene.id}/strands`, { strandId: lena.id });
    await api('PATCH', `/api/nodes/${szene.id}`, { turningPoint: true });
    await api('PUT', '/api/story', {
      columns: [[leer.id], [szene.id]],
      marks: [{ label: 'Tag 1', beforeColumn: 1 }],
    });

    const proof = await api<ProofPackage>('GET', '/api/proofreading/package');
    assert.deepEqual(proof.strands, [{ id: lena.id, name: 'Lena', color: 'teal' }]);
    assert.deepEqual(proof.storyMarks, [{ label: 'Tag 1', position: 2 }]);
    assert.deepEqual(
      proof.chapters[0]!.scenes.map((s) => [s.title, s.strandIds, s.turningPoint, s.storyOrder]),
      [
        ['Am Bahnhof', [lena.id], true, 2],
        ['Noch leer', [], false, 1],
      ],
    );
    assert.equal(proof.format, 'wortomat-proof');
    assert.equal(proof.title, 'Korrekturbuch');
    assert.deepEqual(
      proof.chapters.map((c) => [
        c.number,
        c.part,
        c.title,
        c.scenes.map((s) => [s.title, s.paragraphs]),
      ]),
      [
        [
          1,
          'Teil Eins',
          'Ankunft',
          [
            ['Am Bahnhof', ['Lena wartete am Bahnhof.', 'Der Zug kam zu spät.']],
            ['Noch leer', []],
          ],
        ],
      ],
    );

    const note = (patch: object) => ({
      id: 'n',
      sceneId: szene.id,
      paragraph: 1,
      quote: '',
      prefix: '',
      suffix: '',
      note: '',
      suggestion: null,
      createdAt: '',
      ...patch,
    });
    const result = await api<ProofImportResult>('POST', '/api/proofreading/import', {
      format: 'wortomat-proof-notes',
      version: 1,
      packageId: proof.id,
      title: proof.title,
      exportedAt: '',
      notes: [
        note({ id: 'a', quote: 'zu spät', prefix: 'Zug kam ', note: 'Wie spät genau?' }),
        note({ id: 'b', paragraph: 0, quote: 'wartete', suggestion: 'harrte', note: '' }),
        note({ id: 'c', quote: 'Flughafen' }),
        note({ id: 'd', sceneId: leer.id, quote: 'irgendwas' }),
        note({ id: 'e', sceneId: 'gibt-es-nicht', quote: 'x' }),
        // Suggestion without change: becomes a note
        note({ id: 'f', paragraph: 0, quote: 'Bahnhof', suggestion: 'Bahnhof', note: 'Grün' }),
      ],
    });
    assert.equal(result.applied, 3);
    assert.equal(result.skipped, 0);
    assert.deepEqual(
      result.unmatched.map((u) => [u.note.id, u.sceneTitle]),
      [
        ['c', 'Am Bahnhof'],
        ['d', 'Noch leer'],
        ['e', null],
      ],
    );

    const content = await api<SceneContent>('GET', `/api/scenes/${szene.id}/content`);
    const fixme = (attrs: object) => ({ type: 'annotation', attrs: { kind: 'fixme', ...attrs } });
    assert.deepEqual(content.doc?.content, [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Lena ' },
          { type: 'text', text: 'wartete', marks: [fixme({ note: null, suggestion: 'harrte' })] },
          { type: 'text', text: ' am ' },
          { type: 'text', text: 'Bahnhof', marks: [fixme({ note: 'Grün', suggestion: null })] },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Der Zug kam ' },
          {
            type: 'text',
            text: 'zu spät',
            marks: [{ type: 'italic' }, fixme({ note: 'Wie spät genau?', suggestion: null })],
          },
          { type: 'text', text: '.' },
        ],
      },
    ]);
    // Text and word count stay; the marks count in the tree
    assert.equal(content.wordCount, 9);
    assert.deepEqual(content.annotations, { todo: 0, idea: 0, fixme: 3 });
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.equal(nodes.find((n) => n.id === szene.id)?.annotations?.fixme, 3);

    // The phone always sends all notes: already imported ones are skipped
    const again = await api<ProofImportResult>('POST', '/api/proofreading/import', {
      format: 'wortomat-proof-notes',
      version: 1,
      packageId: proof.id,
      title: proof.title,
      exportedAt: '',
      notes: [
        note({ id: 'a', quote: 'zu spät', prefix: 'Zug kam ', note: 'Wie spät genau?' }),
        note({ id: 'c', quote: 'Flughafen' }),
      ],
    });
    assert.deepEqual([again.applied, again.skipped, again.unmatched.length], [0, 1, 1]);

    // Proofreading copy as an HTML file: as a download (browser) or into a file (desktop)
    const download = await fetch(`${server.url}/api/proofreading/export`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-type') ?? '', /text\/html/);
    assert.match(
      decodeURIComponent(download.headers.get('content-disposition') ?? ''),
      /Korrekturbuch – Korrekturfassung\.html/,
    );
    const html = await download.text();
    assert.match(html, /Lena wartete am Bahnhof/);
    const saved = await api<{ filePath: string }>('POST', '/api/proofreading/export', {
      filePath: path.join(tmpDir, 'korrektur', 'Zum Handy'),
    });
    assert.equal(saved.filePath, path.join(tmpDir, 'korrektur', 'Zum Handy.html'));
    assert.match(await readFile(saved.filePath, 'utf8'), /id="proof-data"/);

    const status = async (body: unknown) =>
      (
        await fetch(`${server.url}/api/proofreading/import`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(await status({ format: 'etwas anderes', notes: [] }), 400);
    assert.equal(await status({ format: 'wortomat-proof-notes', version: 2, notes: [] }), 400);
    assert.equal(
      await status({ format: 'wortomat-proof-notes', version: 1, notes: [note({ quote: '' })] }),
      400,
    );
  });

  it('finds notes files from the phone in the downloads folder and cleans up finished ones', async () => {
    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'postkasten', 'Buch'),
      title: 'Postkasten',
    });
    const kapitel = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const szene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: kapitel.id,
      kind: 'scene',
      title: 'S',
    });
    await api('PUT', `/api/scenes/${szene.id}/content`, {
      doc: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Eins zwei drei vier.' }] }],
      },
      text: 'Eins zwei drei vier.',
      wordCount: 4,
    });

    const downloads = path.join(tmpDir, 'downloads');
    await mkdir(downloads, { recursive: true });
    const note = (id: string, quote: string, sceneId = szene.id) => ({
      id,
      sceneId,
      paragraph: 0,
      quote,
      prefix: '',
      suffix: '',
      note: `Notiz ${id}`,
      suggestion: null,
      createdAt: '',
    });
    const notesFile = async (name: string, notes: object[], minutesAgo: number) => {
      const file = path.join(downloads, name);
      await writeFile(
        file,
        JSON.stringify({
          format: 'wortomat-proof-notes',
          version: 1,
          packageId: 'p',
          title: 't',
          exportedAt: '',
          notes,
        }),
      );
      const time = new Date(Date.now() - minutesAgo * 60_000);
      await utimes(file, time, time);
    };
    // The phone always sends all notes: the second file contains the first one again
    await notesFile('Postkasten.notizen.txt', [note('a', 'zwei')], 10);
    await notesFile('Postkasten.notizen(1).txt', [note('a', 'zwei'), note('b', 'vier')], 1);
    // Other books, broken and foreign files are left out
    await notesFile('Anderes Buch.notizen.txt', [note('x', 'y', 'fremde-szene')], 5);
    await notesFile(
      'Gemischt.notizen.txt',
      [note('c', 'drei'), note('z', 'y', 'fremde-szene')],
      20,
    );
    await writeFile(path.join(downloads, 'kaputt.notizen.txt'), '{ kein json');
    await writeFile(path.join(downloads, 'Einkauf.txt'), 'Milch');

    const inbox = await api<ProofInbox>('GET', '/api/proofreading/inbox');
    assert.equal(inbox.dir, downloads);
    assert.deepEqual(
      inbox.files.map((f) => [f.name, f.notes, f.newNotes, f.done]),
      [
        ['Postkasten.notizen(1).txt', 2, 2, false],
        ['Postkasten.notizen.txt', 1, 1, false],
        ['Gemischt.notizen.txt', 1, 1, false],
      ],
    );
    assert.equal(inbox.newNotes, 3); // a, b, c – each only once

    const result = await api<ProofImportResult>('POST', '/api/proofreading/inbox/import');
    assert.deepEqual([result.applied, result.skipped, result.unmatched.length], [3, 0, 0]);
    const content = await api<SceneContent>('GET', `/api/scenes/${szene.id}/content`);
    assert.equal(content.annotations.fixme, 3);
    const after = await api<ProofInbox>('GET', '/api/proofreading/inbox');
    assert.equal(after.newNotes, 0);
    // the mixed file contains notes for another book – never delete it
    assert.deepEqual(
      after.files.map((f) => [f.name, f.done]),
      [
        ['Postkasten.notizen(1).txt', true],
        ['Postkasten.notizen.txt', true],
        ['Gemischt.notizen.txt', false],
      ],
    );

    // Cleaning up: only files whose notes all belong to this book and are imported
    const cleaned = await api<{ deleted: string[] }>('POST', '/api/proofreading/inbox/clean');
    assert.deepEqual(cleaned.deleted.sort(), [
      'Postkasten.notizen(1).txt',
      'Postkasten.notizen.txt',
    ]);
    assert.deepEqual((await readdir(downloads)).sort(), [
      'Anderes Buch.notizen.txt',
      'Einkauf.txt',
      'Gemischt.notizen.txt',
      'kaputt.notizen.txt',
    ]);
  });

  it('upgrades older project files to the new schema on opening', async () => {
    const project = await api<ProjectInfo>('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'alt', 'Altes Buch'),
      title: 'Altes Buch',
    });
    const kapitel = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: null,
      kind: 'chapter',
      title: 'K',
    });
    const szene = await api<ManuscriptNode>('POST', '/api/nodes', {
      parentId: kapitel.id,
      kind: 'scene',
      title: 'S',
    });
    await api('POST', '/api/project/close');

    // Reset the file to the state before notes and scene status (schema 1)
    const old = new DatabaseSync(project.filePath);
    old.exec(
      'DROP TABLE proof_imported; DROP TABLE story_marks; ALTER TABLE nodes DROP COLUMN story_order; DROP TABLE scene_strands; DROP TABLE strands; ALTER TABLE nodes DROP COLUMN turning_point; DROP TABLE map_pins; DROP TABLE maps; DROP TABLE writing_log; ALTER TABLE project DROP COLUMN export_settings; ALTER TABLE project DROP COLUMN cover_image_id; ALTER TABLE scene_content DROP COLUMN todo_count; ALTER TABLE scene_content DROP COLUMN idea_count; ALTER TABLE scene_content DROP COLUMN fixme_count; ALTER TABLE nodes DROP COLUMN status; DROP TABLE scene_tags; DROP TABLE tags; DROP TABLE scene_links; DROP TABLE note_images; DROP TABLE notes; DROP TABLE note_groups; DROP TABLE note_fts; PRAGMA user_version = 1;',
    );
    old.close();

    const upgraded = await api<ProjectInfo>('POST', '/api/project/open', {
      filePath: project.filePath,
    });
    assert.equal(upgraded.coverImageId, null);
    const note = await api<NoteSummary>('POST', '/api/notes', { kind: 'place', title: 'Mühle' });
    assert.equal(note.title, 'Mühle');
    // Existing scenes get the status idea on upgrade
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    assert.equal(nodes.find((n) => n.id === szene.id)?.status, 'idea');
    assert.equal(nodes.find((n) => n.id === szene.id)?.turningPoint, false);
  });

  it('stores app settings permanently – even without an open project', async () => {
    const openProject = await api<ProjectInfo>('GET', '/api/project');
    await api('POST', '/api/project/close');
    assert.deepEqual(await api('GET', '/api/settings'), {
      language: null,
      sidebarWidth: null,
      quoteStyle: 'de',
      theme: 'system',
      fontSize: 'medium',
      revisionMode: false,
      plotView: DEFAULT_PLOT_VIEW,
    });

    assert.deepEqual(await api('PATCH', '/api/settings', { sidebarWidth: 340.6 }), {
      language: null,
      sidebarWidth: 341,
      quoteStyle: 'de',
      theme: 'system',
      fontSize: 'medium',
      revisionMode: false,
      plotView: DEFAULT_PLOT_VIEW,
    });
    // Changing single values leaves the others alone
    assert.deepEqual(await api('PATCH', '/api/settings', { quoteStyle: 'de-guillemets' }), {
      language: null,
      sidebarWidth: 341,
      quoteStyle: 'de-guillemets',
      theme: 'system',
      fontSize: 'medium',
      revisionMode: false,
      plotView: DEFAULT_PLOT_VIEW,
    });
    assert.deepEqual(await api('PATCH', '/api/settings', { language: 'en' }), {
      language: 'en',
      sidebarWidth: 341,
      quoteStyle: 'de-guillemets',
      theme: 'system',
      fontSize: 'medium',
      revisionMode: false,
      plotView: DEFAULT_PLOT_VIEW,
    });

    // A second server with the same data folder (= app restart) reads the value
    const restarted = await startServer({
      mode: 'desktop',
      version: 'test',
      defaultProjectDir: tmpDir,
      dataDir: path.join(tmpDir, 'appdata'),
      downloadsDir: path.join(tmpDir, 'downloads'),
      token: TOKEN,
      logger: false,
    });
    try {
      const response = await fetch(`${restarted.url}/api/settings`, {
        headers: { [AUTH_HEADER]: TOKEN },
      });
      assert.deepEqual(await response.json(), {
        language: 'en',
        sidebarWidth: 341,
        quoteStyle: 'de-guillemets',
        theme: 'system',
        fontSize: 'medium',
        revisionMode: false,
        plotView: DEFAULT_PLOT_VIEW,
      });
    } finally {
      await restarted.close();
    }

    const invalid = async (request: object) =>
      (
        await fetch(`${server.url}/api/settings`, {
          method: 'PATCH',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      ).status;
    assert.equal(await invalid({ sidebarWidth: 20 }), 400);
    assert.equal(await invalid({ sidebarWidth: 'breit' }), 400);
    assert.equal(await invalid({ quoteStyle: 'klingonisch' }), 400);
    assert.equal(await invalid({ language: 'tlh' }), 400);
    assert.equal(await invalid({ theme: 'sepia' }), 400);
    assert.equal(await invalid({ fontSize: 'riesig' }), 400);
    assert.equal(await invalid({ revisionMode: 'ja' }), 400);
    assert.equal(await invalid({ plotView: { order: 'zufällig' } }), 400);
    assert.equal(await invalid({ plotView: { compact: 'ja' } }), 400);
    assert.equal(await invalid({ plotView: { vertical: 'ja' } }), 400);
    // The plot view can be changed partially
    assert.deepEqual(
      (await api<AppSettings>('PATCH', '/api/settings', { plotView: { order: 'book' } })).plotView,
      { order: 'book', onlyTurningPoints: true, compact: false, vertical: false },
    );
    assert.deepEqual(
      (await api<AppSettings>('PATCH', '/api/settings', { plotView: { compact: true } })).plotView,
      { order: 'book', onlyTurningPoints: true, compact: true, vertical: false },
    );
    await api('PATCH', '/api/settings', { plotView: DEFAULT_PLOT_VIEW });
    assert.equal(
      (await api<AppSettings>('PATCH', '/api/settings', { revisionMode: true })).revisionMode,
      true,
    );
    await api('PATCH', '/api/settings', { revisionMode: false });
    assert.deepEqual(await api('PATCH', '/api/settings', { theme: 'dark', fontSize: 'large' }), {
      language: 'en',
      sidebarWidth: 341,
      quoteStyle: 'de-guillemets',
      theme: 'dark',
      fontSize: 'large',
      revisionMode: false,
      plotView: DEFAULT_PLOT_VIEW,
    });

    // Back to the defaults
    assert.deepEqual(
      await api('PATCH', '/api/settings', {
        language: null,
        sidebarWidth: null,
        quoteStyle: 'de',
        theme: 'system',
        fontSize: 'medium',
        revisionMode: false,
        plotView: DEFAULT_PLOT_VIEW,
      }),
      {
        language: null,
        sidebarWidth: null,
        quoteStyle: 'de',
        theme: 'system',
        fontSize: 'medium',
        revisionMode: false,
        plotView: DEFAULT_PLOT_VIEW,
      },
    );

    // Reopen for the following tests
    await api('POST', '/api/project/open', { filePath: openProject.filePath });
  });

  it('returns error messages in the language from Accept-Language', async () => {
    const message = async (language?: string) => {
      const response = await fetch(`${server.url}/api/notes/gibt-es-nicht/content`, {
        headers: { [AUTH_HEADER]: TOKEN, ...(language ? { 'Accept-Language': language } : {}) },
      });
      assert.equal(response.status, 404);
      return ((await response.json()) as { message: string }).message;
    };
    assert.equal(await message(), 'Notiz nicht gefunden.');
    assert.equal(await message('en'), 'Note not found.');
    assert.equal(await message('en-US,en;q=0.9'), 'Note not found.');
    assert.equal(await message('fr-FR,de;q=0.8'), 'Notiz nicht gefunden.');
  });

  it('lists folders and project files for the file picker', async () => {
    const root = path.join(tmpDir, 'auswahl');
    await mkdir(path.join(root, 'Kapitel 10'), { recursive: true });
    await mkdir(path.join(root, 'Kapitel 2'));
    await mkdir(path.join(root, '.versteckt'));
    await writeFile(path.join(root, 'Roman.wortomat'), '');
    await writeFile(path.join(root, 'notizen.txt'), '');

    const listing = await api<DirectoryListing>(
      'GET',
      `/api/files?dir=${encodeURIComponent(root)}`,
    );
    assert.equal(listing.path, root);
    assert.equal(listing.parent, tmpDir);
    // folders first (natural sort), then projects; no hidden or foreign files
    assert.deepEqual(
      listing.entries.map((entry) => [entry.name, entry.kind]),
      [
        ['Kapitel 2', 'directory'],
        ['Kapitel 10', 'directory'],
        ['Roman.wortomat', 'project'],
      ],
    );

    // Missing folder → nearest existing one above; without one, the default folder
    const missing = await api<DirectoryListing>(
      'GET',
      `/api/files?dir=${encodeURIComponent(path.join(root, 'gibt', 'es', 'nicht'))}`,
    );
    assert.equal(missing.path, root);
    assert.equal((await api<DirectoryListing>('GET', '/api/files')).path, tmpDir);
  });

  it('refuses scenes directly at the top level', async () => {
    const response = await fetch(`${server.url}/api/nodes`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: null, kind: 'scene', title: 'X' }),
    });
    assert.equal(response.status, 400);
  });

  it('stores images and checks the format by their content', async () => {
    const upload = (bytes: Buffer, name: string, type: string) => {
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(bytes)], { type }), name);
      form.append('width', '1');
      form.append('height', '1');
      return fetch(`${server.url}/api/images`, {
        method: 'POST',
        headers: { [AUTH_HEADER]: TOKEN },
        body: form,
      });
    };

    const ok = await upload(PNG_1PX, 'punkt.png', 'image/png');
    assert.equal(ok.status, 201);
    const image = (await ok.json()) as ImageInfo;
    assert.equal(image.mimeType, 'image/png');
    assert.equal(image.width, 1);

    const download = await fetch(server.url + image.url, { headers: { [AUTH_HEADER]: TOKEN } });
    assert.equal(download.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), PNG_1PX);

    // SVG with a script disguised as PNG → rejected.
    const fake = await upload(Buffer.from('<svg onload="alert(1)"/>'), 'boese.png', 'image/png');
    assert.equal(fake.status, 400);
  });
});
