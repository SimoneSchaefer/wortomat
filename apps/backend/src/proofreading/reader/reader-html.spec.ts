import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ProofPackage } from '@wortomat/shared';
import { readerHtml } from './reader-html.js';

const proof: ProofPackage = {
  format: 'wortomat-proof',
  version: 1,
  id: 'p1',
  title: 'Liebe & <Tod>',
  author: 'A',
  exportedAt: '2026-10-13T12:00:00.000Z',
  chapters: [
    {
      id: 'k1',
      title: 'K',
      number: 1,
      part: null,
      scenes: [{ id: 's1', title: 'S', paragraphs: ['Er schrieb </script><script>alert(1)'] }],
    },
  ],
};

describe('readerHtml', () => {
  const html = readerHtml(proof);

  it('bettet die Daten so ein, dass Text aus dem Buch den Skript-Block nicht beendet', () => {
    const data = /<script type="application\/json" id="proof-data">(.*?)<\/script>/s.exec(html);
    assert.ok(data, 'Datenblock fehlt');
    assert.deepEqual(JSON.parse(data[1]!), proof);
    // exactly two script blocks: data and app
    assert.equal(html.match(/<\/script>/g)?.length, 2);
  });

  it('enthält die Lese-App als eigenständiges Skript und einen lesbaren Titel', () => {
    assert.match(html, /<title>Liebe &amp; &lt;Tod&gt; – Korrekturfassung<\/title>/);
    const app = /<script>(.*)<\/script>/s.exec(html.slice(html.lastIndexOf('<script>')))?.[1];
    assert.ok(app?.includes(';(function readerApp()'), 'App fehlt');
    // no reference to modules – otherwise the file would not run on the phone
    assert.doesNotMatch(app!, /\brequire\(|\bimport\b|\bexports\b/);
    assert.doesNotThrow(() => new Function(app!));
  });

  it('stellt __name bereit, das esbuild (keepNames) im Desktop-Bundle in die App einfügt', () => {
    const app = html.slice(html.lastIndexOf('<script>') + '<script>'.length);
    const prelude = app.slice(0, app.indexOf('(function readerApp()'));
    const named = new Function(`${prelude} return __name(function f() {}, 'f');`)();
    assert.equal(typeof named, 'function');
  });
});
