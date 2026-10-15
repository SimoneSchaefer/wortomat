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

  it('embeds the data so that book text cannot end the script block', () => {
    const data = /<script type="application\/json" id="proof-data">(.*?)<\/script>/s.exec(html);
    assert.ok(data, 'data block missing');
    assert.deepEqual(JSON.parse(data[1]!), proof);
    // exactly two script blocks: data and app
    assert.equal(html.match(/<\/script>/g)?.length, 2);
  });

  it('contains the reader app as a self-contained script and a readable title', () => {
    assert.match(html, /<title>Liebe &amp; &lt;Tod&gt; – Korrekturfassung<\/title>/);
    const app = /<script>(.*)<\/script>/s.exec(html.slice(html.lastIndexOf('<script>')))?.[1];
    assert.ok(app?.includes(';(function readerApp()'), 'app missing');
    // no reference to modules – otherwise the file would not run on the phone
    assert.doesNotMatch(app!, /\brequire\(|\bimport\b|\bexports\b/);
    assert.doesNotThrow(() => new Function(app!));
  });

  it('provides __name, which esbuild (keepNames) inserts into the app in the desktop bundle', () => {
    const app = html.slice(html.lastIndexOf('<script>') + '<script>'.length);
    const prelude = app.slice(0, app.indexOf('(function readerApp()'));
    const named = new Function(`${prelude} return __name(function f() {}, 'f');`)();
    assert.equal(typeof named, 'function');
  });
});
