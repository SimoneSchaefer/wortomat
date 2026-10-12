import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import type {
  ImageInfo,
  ManuscriptNode,
  ProjectInfo,
  ProjectListEntry,
  SceneContent,
  SearchHit,
} from '@wortomat/shared';
import { AUTH_HEADER, type RunningServer, startServer } from './server.js';

const TOKEN = 'test-token';
// Kleinstes gültiges PNG (1×1 Pixel).
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('REST-API', () => {
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
      token: TOKEN,
      logger: false,
    });
  });

  after(async () => {
    await server.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('lehnt Anfragen ohne Token ab', async () => {
    const response = await fetch(`${server.url}/api/app`);
    assert.equal(response.status, 401);
  });

  it('lehnt fremde Host-Header ab (DNS-Rebinding)', async () => {
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

  it('meldet 409, solange kein Projekt geöffnet ist', async () => {
    assert.equal(await api('GET', '/api/project'), null);
    const response = await fetch(`${server.url}/api/nodes`, { headers: { [AUTH_HEADER]: TOKEN } });
    assert.equal(response.status, 409);
  });

  it('durchläuft Projekt → Kapitel → Szene → Inhalt → Suche → Wiederöffnen', async () => {
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
    // Größer als das Express-Standardlimit von 100 KB.
    const longText = 'Wort '.repeat(40_000);
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc,
      text: `Die Häuser am Fluss. ${longText}`,
      wordCount: 40_004,
    });

    const hits = await api<SearchHit[]>('GET', '/api/search?q=hauser');
    assert.equal(hits.length, 1);
    assert.equal(hits[0]!.nodeId, scene.id);
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

  it('verschiebt Szenen und Kapitel und nummeriert neu', async () => {
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

    // C vor A
    let nodes = await move(c.id, k1.id, a.id);
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'A', 'B']);
    assert.deepEqual(
      nodes
        .filter((n) => n.parentId === k1.id)
        .map((n) => n.sortOrder)
        .sort(),
      [1, 2, 3],
    );

    // A ans Ende von K2
    nodes = await move(a.id, k2.id, null);
    assert.deepEqual(titlesUnder(nodes, k1.id), ['C', 'B']);
    assert.deepEqual(titlesUnder(nodes, k2.id), ['A']);

    // Kapitel umsortieren, dann in einen Teil schieben (Szenen wandern mit)
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
    assert.equal(await rejected(b.id, null, null), 400, 'Szene auf oberster Ebene');
    assert.equal(await rejected(teil.id, k2.id, null), 400, 'Teil in Kapitel');
    assert.equal(await rejected(b.id, k2.id, c.id), 400, 'Bezugselement aus anderem Kapitel');
    assert.equal(await rejected(k2.id, k2.id, null), 400, 'in sich selbst');

    await api('DELETE', `/api/nodes/${teil.id}`);
    await api('DELETE', `/api/nodes/${k2.id}`);
  });

  it('führt eine Liste aller angelegten und geöffneten Projekte', async () => {
    const titles = (list: ProjectListEntry[]) => list.map((p) => p.title);
    const create = (name: string) =>
      api<ProjectInfo>('POST', '/api/project/create', {
        filePath: path.join(tmpDir, 'liste', name),
        title: name,
      });

    const erstes = await create('Erstes Buch');
    const zweites = await create('Zweites Buch');
    let list = await api<ProjectListEntry[]>('GET', '/api/projects');
    // zuletzt verwendet zuerst; das "Roman"-Projekt aus dem vorigen Test steht dahinter
    assert.deepEqual(titles(list).slice(0, 2), ['Zweites Buch', 'Erstes Buch']);
    assert.equal(list.find((p) => p.isOpen)?.title, 'Zweites Buch');

    // Erneutes Öffnen schiebt nach vorne; Titeländerungen und Wörter kommen frisch aus der Datei
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

    // Gelöschte Datei bleibt sichtbar, aber als nicht verfügbar
    await rm(zweites.filePath);
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    const missing = list.find((p) => p.filePath === zweites.filePath)!;
    assert.equal(missing.available, false);
    assert.equal(missing.title, 'Zweites Buch'); // Dateiname als Ersatz

    await api('POST', '/api/projects/forget', { filePath: zweites.filePath });
    list = await api<ProjectListEntry[]>('GET', '/api/projects');
    assert.equal(
      list.some((p) => p.filePath === zweites.filePath),
      false,
    );
  });

  it('verweigert Szenen direkt auf oberster Ebene', async () => {
    const response = await fetch(`${server.url}/api/nodes`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: null, kind: 'scene', title: 'X' }),
    });
    assert.equal(response.status, 400);
  });

  it('speichert Bilder und prüft das Format anhand des Inhalts', async () => {
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

    // SVG mit Skript, als PNG getarnt → abgelehnt.
    const fake = await upload(Buffer.from('<svg onload="alert(1)"/>'), 'boese.png', 'image/png');
    assert.equal(fake.status, 400);
  });
});
