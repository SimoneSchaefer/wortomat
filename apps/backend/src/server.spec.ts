import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import type {
  ImageInfo,
  ManuscriptNode,
  ProjectInfo,
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
