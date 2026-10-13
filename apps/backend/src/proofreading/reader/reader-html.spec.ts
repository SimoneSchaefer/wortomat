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
    // genau zwei Skript-Blöcke: Daten und App
    assert.equal(html.match(/<\/script>/g)?.length, 2);
  });

  it('enthält die Lese-App als eigenständiges Skript und einen lesbaren Titel', () => {
    assert.match(html, /<title>Liebe &amp; &lt;Tod&gt; – Korrekturfassung<\/title>/);
    const app = /<script>(.*)<\/script>/s.exec(html.slice(html.lastIndexOf('<script>')))?.[1];
    assert.ok(app?.startsWith('(function readerApp()'), 'App fehlt');
    // ohne Bezug auf Module – sonst liefe die Datei auf dem Handy nicht
    assert.doesNotMatch(app!, /\brequire\(|\bimport\b|\bexports\b/);
    assert.doesNotThrow(() => new Function(app!));
  });
});
