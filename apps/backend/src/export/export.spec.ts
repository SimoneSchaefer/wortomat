import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import type {
  BookLayout,
  ExportCapabilities,
  ExportPreview,
  ExportResult,
  ExportSettings,
  ExportSettingsResponse,
  ImageInfo,
  ManuscriptNode,
  ProjectInfo,
} from '@wortomat/shared';
import JSZip from 'jszip';
import { AUTH_HEADER, type RunningServer, startServer } from '../server.js';
import { DEFAULT_LAYOUT, sanitizeLayout } from './layout.js';
import { escape, renderLatex } from './latex-renderer.js';
import { describeLatexError } from './pdflatex.js';

const TOKEN = 'export-test';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
// Kopf einer WebP-Datei – genügt der Formaterkennung im Backend.
const WEBP_HEADER = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 ')]);

const hasTool = (tool: string) => {
  try {
    execFileSync(tool, ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

describe('Export', () => {
  let server: RunningServer;
  let tmpDir: string;
  let pdfAvailable = false;

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
  /** Export im Desktop-Modus (Datei wird geschrieben). */
  const exportTo = async (
    format: string,
    template: string,
    includeSceneTitles = false,
    layout?: BookLayout,
  ) => {
    const filePath = path.join(
      tmpDir,
      `out-${format}-${template}-${includeSceneTitles}${layout ? '-layout' : ''}`,
    );
    const result = await api<ExportResult>('POST', '/api/export', {
      format,
      template,
      includeSceneTitles,
      layout,
      filePath,
    });
    return { ...result, data: await readFile(result.filePath) };
  };

  const upload = async (bytes: Buffer, name: string) => {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(bytes)]), name);
    const response = await fetch(`${server.url}/api/images`, {
      method: 'POST',
      headers: { [AUTH_HEADER]: TOKEN },
      body: form,
    });
    return ((await response.json()) as ImageInfo).url;
  };

  const text = (value: string, ...marks: string[]) => ({
    type: 'text',
    text: value,
    marks: marks.map((type) =>
      type.startsWith('annotation:')
        ? { type: 'annotation', attrs: { kind: type.split(':')[1] } }
        : { type },
    ),
  });
  const paragraph = (...content: object[]) => ({ type: 'paragraph', content });

  before(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), 'wortomat-export-'));
    server = await startServer({
      mode: 'desktop',
      version: 'test',
      defaultProjectDir: tmpDir,
      dataDir: path.join(tmpDir, 'appdata'),
      token: TOKEN,
      logger: false,
    });
    pdfAvailable = (await api<ExportCapabilities>('GET', '/api/export/capabilities')).pdf.available;

    await api('POST', '/api/project/create', {
      filePath: path.join(tmpDir, 'Die Häuser am Fluss'),
      title: 'Die Häuser am Fluss',
      author: 'Ada Muster',
    });
    const png = await upload(PNG_1PX, 'karte.png');
    const webp = await upload(WEBP_HEADER, 'foto.webp');

    const node = (parentId: string | null, kind: string, title: string) =>
      api<ManuscriptNode>('POST', '/api/nodes', { parentId, kind, title });
    const save = (id: string, content: object[]) =>
      api('PUT', `/api/scenes/${id}/content`, {
        doc: { type: 'doc', content },
        text: '',
        wordCount: 10,
      });

    const teil = await node(null, 'part', 'Erster Teil');
    const k1 = await node(teil.id, 'chapter', 'Ankunft');
    const s1 = await node(k1.id, 'scene', 'Bahnhof (Arbeitstitel)');
    await save(s1.id, [
      paragraph(
        text('Der Zug '),
        text('hielt', 'bold'),
        text(' am '),
        text('Hafen', 'italic'),
        text('.'),
      ),
      paragraph(
        text('Recherche nötig', 'annotation:todo'),
        text(' – 100 % & $ # _ ~ \\ <<Tag>> "Zitat" ,,unten“'),
      ),
      paragraph(text('Smiley 😀 und Ελληνικά.')),
      { type: 'image', attrs: { src: png, alt: 'Karte' } },
    ]);
    const s2 = await node(k1.id, 'scene', 'Markt');
    await save(s2.id, [paragraph(text('Am Markt roch es nach Fisch.'))]);
    await node(k1.id, 'scene', 'Leere Szene'); // ohne Text → wird ausgelassen
    const k2 = await node(teil.id, 'chapter', 'Abschied');
    const s3 = await node(k2.id, 'scene', 'Kai');
    await save(s3.id, [
      paragraph(text('Sie winkte.')),
      paragraph(
        text('Ein '),
        text('Stand', 'underline'),
        text(' war '),
        text('leer', 'strike'),
        text('.'),
      ),
      { type: 'image', attrs: { src: webp, alt: 'Foto' } },
      { type: 'image', attrs: { src: png, alt: 'Karte, noch einmal' } }, // dasselbe Bild erneut
    ]);
  });

  after(async () => {
    await server.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('meldet, ob pdfLaTeX verfügbar ist', async () => {
    const caps = await api<ExportCapabilities>('GET', '/api/export/capabilities');
    assert.equal(typeof caps.pdf.available, 'boolean');
    if (caps.pdf.available) assert.match(caps.pdf.version ?? '', /pdfTeX/);
    assert.equal(caps.fonts.length, 11);
    assert.equal(caps.fonts.find((font) => font.id === 'computermodern')?.optional, true);
    const palatino = caps.fonts.find((font) => font.id === 'palatino');
    assert.equal(palatino?.label, 'Palatino');
    assert.match(palatino?.cssFamily ?? '', /Palatino/);
    if (!caps.pdf.available) assert.ok(caps.fonts.every((font) => !font.pdfAvailable));
  });

  it('liefert die Schriftdateien der TeX-Installation für die Vorschau', async () => {
    const get = (urlPath: string) =>
      fetch(server.url + urlPath, { headers: { [AUTH_HEADER]: TOKEN } });
    if (pdfAvailable) {
      const response = await get('/api/export/fonts/palatino/italic');
      // nur, wenn TeX Gyre installiert ist (bei TeX Live „recommended“ dabei)
      if (response.status === 200) {
        assert.equal(response.headers.get('content-type'), 'font/otf');
        const head = Buffer.from(await response.arrayBuffer())
          .subarray(0, 4)
          .toString('latin1');
        assert.equal(head, 'OTTO'); // OpenType mit CFF-Umrissen
      }
    }
    // Nur Dateien aus dem Katalog – nichts anderes aus der TeX-Installation
    for (const urlPath of [
      '/api/export/fonts/comic/regular',
      '/api/export/fonts/palatino/constructor',
      '/api/export/fonts/palatino/..%2F..%2Fetc%2Fpasswd',
    ]) {
      assert.equal((await get(urlPath)).status, 404, urlPath);
    }
  });

  it('merkt sich die Einstellungen des Export-Dialogs im Buch', async () => {
    const initial = await api<ExportSettingsResponse>('GET', '/api/export/settings');
    assert.deepEqual(initial.settings, initial.defaults);
    assert.deepEqual(initial.defaults.layout, DEFAULT_LAYOUT);

    const saved = await api<ExportSettings>('PUT', '/api/export/settings', {
      format: 'pdf',
      template: 'roman',
      includeSceneTitles: true,
      layout: {
        ...DEFAULT_LAYOUT,
        pageWidth: 148,
        pageHeight: 210,
        font: 'garamond',
        fontSize: 12.3,
      },
    });
    assert.equal(saved.layout.fontSize, 12.5); // auf halbe Punkte gerundet

    const again = await api<ExportSettingsResponse>('GET', '/api/export/settings');
    assert.deepEqual(again.settings, saved);
    assert.equal(again.settings.format, 'pdf');
    assert.equal(again.settings.layout.font, 'garamond');

    // Unsinn wird durch Vorgaben ersetzt
    const repaired = await api<ExportSettings>('PUT', '/api/export/settings', {
      format: 'odt',
      layout: { font: 'comic-sans', pageWidth: 'breit' },
    });
    assert.equal(repaired.format, 'docx');
    assert.equal(repaired.layout.font, 'palatino');
    assert.equal(repaired.layout.pageWidth, DEFAULT_LAYOUT.pageWidth);
  });

  it('liefert den Anfang des Buchs für die Seitenvorschau', async () => {
    const preview = await api<ExportPreview>('GET', '/api/export/preview');
    assert.equal(preview.title, 'Die Häuser am Fluss');
    assert.ok(preview.chapterTitle);
    assert.match(preview.html, /<p>/);
    assert.doesNotMatch(preview.html, /scene-title/);
    const withTitles = await api<ExportPreview>('GET', '/api/export/preview?sceneTitles=true');
    assert.match(withTitles.html, /class="scene-title"/);
  });

  it('exportiert eigenständiges HTML in Lesereihenfolge – ohne Todo-Markierungen', async () => {
    const { data, filePath, warnings } = await exportTo('html', 'normseite');
    const html = data.toString('utf8');
    assert.ok(filePath.endsWith('.html'));
    assert.deepEqual(warnings, []);
    assert.match(html, /<title>Die Häuser am Fluss<\/title>/);
    const order = ['Erster Teil', 'Ankunft', 'Der Zug', 'Am Markt', 'Abschied', 'Sie winkte'].map(
      (needle) => html.indexOf(needle),
    );
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
      'Reihenfolge',
    );
    assert.equal(html.match(/scene-break/g)?.length, 2, 'ein Szenentrenner (+ CSS-Regel)');
    assert.match(html, /<strong>hielt<\/strong>/);
    assert.match(html, /<em>Hafen<\/em>/);
    assert.match(html, /<u>Stand<\/u>/);
    assert.match(html, /<s>leer<\/s>/);
    assert.match(html, /&lt;&lt;Tag&gt;&gt;/);
    assert.doesNotMatch(html, /annotation|wm-annotation/);
    assert.match(html, /Recherche nötig/);
    assert.match(html, /src="data:image\/png;base64,/);
    assert.doesNotMatch(html, /Bahnhof \(Arbeitstitel\)/, 'Szenentitel standardmäßig nicht');
    assert.doesNotMatch(html, /Leere Szene/);
    const withTitles = (await exportTo('html', 'normseite', true)).data.toString('utf8');
    assert.match(withTitles, /<h3 class="scene-title">Bahnhof \(Arbeitstitel\)<\/h3>/);
  });

  it('lässt Teile auf Wunsch weg – die Kapitel bleiben', async () => {
    const exportWithoutParts = async (format: string) => {
      const result = await api<ExportResult>('POST', '/api/export', {
        format,
        template: 'normseite',
        includeSceneTitles: false,
        includeParts: false,
        filePath: path.join(tmpDir, `out-${format}-ohne-teile`),
      });
      return readFile(result.filePath);
    };

    const html = (await exportWithoutParts('html')).toString('utf8');
    assert.doesNotMatch(html, /Erster Teil/);
    assert.match(html, /Ankunft/);
    assert.match(html, /Abschied/);

    const epub = await JSZip.loadAsync(await exportWithoutParts('epub'));
    const nav = await epub.file('OEBPS/nav.xhtml')!.async('string');
    assert.doesNotMatch(nav, /Erster Teil/);
    assert.match(nav, /Ankunft/);
    assert.ok(!Object.keys(epub.files).some((name) => name.includes('teil-')));
  });

  it('exportiert Word-Dateien mit den Vorlagen Normseite und Roman', async () => {
    const read = async (template: string) => {
      const { data, warnings } = await exportTo('docx', template);
      const zip = await JSZip.loadAsync(data);
      return {
        warnings,
        document: await zip.file('word/document.xml')!.async('string'),
        styles: await zip.file('word/styles.xml')!.async('string'),
        settings: await zip.file('word/settings.xml')!.async('string'),
        // nur Dateien, nicht den Ordnereintrag „word/media/“
        media: Object.values(zip.files)
          .filter((entry) => entry.name.startsWith('word/media/') && !entry.dir)
          .map((entry) => entry.name),
      };
    };

    const normseite = await read('normseite');
    assert.match(normseite.styles, /Courier New/);
    assert.match(normseite.document, /<w:pgSz w:w="11906" w:h="16838"/); // A4
    assert.match(normseite.styles, /w:line="360" w:lineRule="exact"/); // genau 18 pt
    assert.match(normseite.document, /<wp:extent cx="9525" cy="9525"\/>/); // 1 × 1 px, nicht aufgeblasen
    assert.doesNotMatch(normseite.document, /w:val="false"/); // keine überflüssigen Formatangaben
    assert.match(normseite.document, /ca\. \d+ Wörter · ca\. 1 Normseite</);
    assert.match(normseite.document, /Der Zug /);
    assert.match(normseite.document, /&lt;&lt;Tag&gt;&gt;/);
    assert.doesNotMatch(normseite.settings, /autoHyphenation w:val="true"|<w:autoHyphenation\/>/);
    assert.equal(normseite.media.length, 1, `PNG eingebettet: ${normseite.media}`);
    assert.match(normseite.media[0]!, /\.png$/);
    assert.deepEqual(normseite.warnings, [
      'Bild „Foto“ (WEBP) kann in Word nicht übernommen werden.',
    ]);

    const roman = await read('roman');
    assert.match(roman.styles, /Palatino Linotype/);
    assert.match(roman.document, /<w:pgSz w:w="7087" w:h="10772"/); // 12,5 × 19 cm
    assert.match(roman.settings, /autoHyphenation/);
    assert.match(roman.settings, /<w:mirrorMargins\/>/); // innen/außen gespiegelt
    assert.doesNotMatch(normseite.settings, /mirrorMargins/);
    assert.match(roman.document, /w:jc w:val="both"/); // Blocksatz
  });

  it('übernimmt Seitengröße, Ränder, Schrift und Schriftgröße in die Vorlage Roman', async () => {
    const layout: BookLayout = {
      pageWidth: 148,
      pageHeight: 210,
      marginInner: 22,
      marginOuter: 16,
      marginTop: 20,
      marginBottom: 25,
      font: 'garamond',
      fontSize: 12,
    };
    const { data } = await exportTo('docx', 'roman', false, layout);
    const zip = await JSZip.loadAsync(data);
    const document = await zip.file('word/document.xml')!.async('string');
    const styles = await zip.file('word/styles.xml')!.async('string');
    assert.match(document, /<w:pgSz w:w="8391" w:h="11906"/); // A5
    assert.match(document, /w:top="1134" w:right="907" w:bottom="1417" w:left="1247"/);
    assert.match(styles, /w:ascii="Garamond"/);
    assert.match(styles, /<w:sz w:val="24"\/>/); // 12 pt

    // Die Normseite bleibt genormt, egal was mitgeschickt wird
    const normseite = await exportTo('docx', 'normseite', false, layout);
    const normDoc = await (
      await JSZip.loadAsync(normseite.data)
    )
      .file('word/document.xml')!
      .async('string');
    assert.match(normDoc, /<w:pgSz w:w="11906" w:h="16838"/);
  });

  it('exportiert ein EPUB 3 mit Inhaltsverzeichnis, Kapiteldateien und Bildern', async () => {
    const { data, filePath, warnings } = await exportTo('epub', 'roman');
    assert.ok(filePath.endsWith('.epub'));
    assert.deepEqual(warnings, [], 'PNG und WebP sind EPUB-Kernformate');
    // Erster ZIP-Eintrag „mimetype“, unkomprimiert (Methode 0) – so erkennen Reader das Format
    assert.equal(data.readUInt16LE(8), 0);
    assert.equal(data.toString('latin1', 30, 38), 'mimetype');
    assert.equal(data.toString('latin1', 38, 58), 'application/epub+zip');

    const zip = await JSZip.loadAsync(data);
    const read = (name: string) => zip.file(name)!.async('string');
    assert.match(await read('META-INF/container.xml'), /full-path="OEBPS\/content\.opf"/);

    const opf = await read('OEBPS/content.opf');
    assert.match(opf, /<dc:title>Die Häuser am Fluss<\/dc:title>/);
    assert.match(opf, /<dc:creator id="autor">Ada Muster<\/dc:creator>/);
    assert.match(opf, /<dc:language>de<\/dc:language>/);
    assert.match(opf, /<meta property="dcterms:modified">\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ<\/meta>/);
    const identifier = /<dc:identifier id="buch-id">(urn:uuid:[0-9a-f-]{36})</.exec(opf)?.[1];
    assert.ok(identifier, 'UUID als Kennung');
    const spine = [...opf.matchAll(/<itemref idref="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(spine, ['titel', 'teil-1', 'kapitel-1', 'kapitel-2']);
    assert.match(opf, /href="images\/bild-1\.png" media-type="image\/png"/);
    assert.match(opf, /href="images\/bild-2\.webp" media-type="image\/webp"/);
    assert.equal(
      opf.match(/media-type="image\//g)?.length,
      2,
      'mehrfach verwendetes Bild nur einmal',
    );

    const nav = await read('OEBPS/nav.xhtml');
    assert.match(
      nav,
      /<li><a href="text\/teil-1\.xhtml">Erster Teil<\/a><ol><li><a href="text\/kapitel-1\.xhtml">Ankunft<\/a><\/li><li><a href="text\/kapitel-2\.xhtml">Abschied<\/a><\/li><\/ol><\/li>/,
      'Kapitel stehen unter ihrem Teil',
    );
    assert.match(await read('OEBPS/toc.ncx'), /playOrder="3"><navLabel><text>Abschied</);

    const kapitel = await read('OEBPS/text/kapitel-1.xhtml');
    assert.match(kapitel, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(kapitel, /<h2 class="chapter">Ankunft<\/h2>/);
    assert.match(kapitel, /<strong>hielt<\/strong>/);
    assert.match(kapitel, /&lt;&lt;Tag&gt;&gt; &quot;Zitat&quot;/);
    assert.match(kapitel, /Smiley 😀 und Ελληνικά\./); // anders als pdfLaTeX: alles bleibt
    assert.match(kapitel, /<img src="\.\.\/images\/bild-1\.png" alt="Karte"\/>/);
    assert.equal(kapitel.match(/class="scene-break"/g)?.length, 1);
    assert.doesNotMatch(kapitel, /annotation/);
    assert.match(
      await read('OEBPS/text/kapitel-2.xhtml'),
      /<img src="\.\.\/images\/bild-1\.png" alt="Karte, noch einmal"\/>/,
      'auch der zweite Verweis auf dasselbe Bild zeigt auf die Datei',
    );

    const again = await exportTo('epub', 'normseite');
    const againOpf = await (
      await JSZip.loadAsync(again.data)
    )
      .file('OEBPS/content.opf')!
      .async('string');
    assert.ok(againOpf.includes(identifier), 'Kennung bleibt bei jedem Export gleich');
  });

  it('setzt ein Titelbild und legt es als Cover ins EPUB', async () => {
    const coverPng = await upload(PNG_1PX, 'cover.png');
    const coverId = coverPng.split('/').pop()!;
    const patch = async (body: object) =>
      fetch(`${server.url}/api/project`, {
        method: 'PATCH',
        headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

    assert.equal((await patch({ coverImageId: 'gibt-es-nicht' })).status, 400);
    const project = (await (await patch({ coverImageId: coverId })).json()) as ProjectInfo;
    assert.equal(project.coverImageId, coverId);

    const { data, warnings } = await exportTo('epub', 'roman');
    assert.deepEqual(warnings, []);
    const zip = await JSZip.loadAsync(data);
    const opf = await zip.file('OEBPS/content.opf')!.async('string');
    assert.match(
      opf,
      /<item id="titelbild" href="images\/titelbild\.png" media-type="image\/png" properties="cover-image"\/>/,
    );
    assert.match(opf, /<meta name="cover" content="titelbild"\/>/);
    assert.match(opf, /<item id="cover" href="text\/cover\.xhtml" [^>]*properties="svg"\/>/);
    const spine = [...opf.matchAll(/<itemref idref="([^"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(spine.slice(0, 2), ['cover', 'titel'], 'Titelbild vor der Titelseite');
    assert.match(
      await zip.file('OEBPS/text/cover.xhtml')!.async('string'),
      /viewBox="0 0 1 1"[^>]*><image width="1" height="1" xlink:href="\.\.\/images\/titelbild\.png"\/>/,
    );
    assert.match(await zip.file('OEBPS/nav.xhtml')!.async('string'), /epub:type="cover"/);

    // Ersetzen: das alte Titelbild verschwindet aus der Datei, weil es sonst nirgends vorkommt
    const nextId = (await upload(PNG_1PX, 'neu.png')).split('/').pop()!;
    await patch({ coverImageId: nextId });
    const imageStatus = async (id: string) =>
      (await fetch(`${server.url}/api/images/${id}`, { headers: { [AUTH_HEADER]: TOKEN } })).status;
    assert.equal(await imageStatus(coverId), 404);
    assert.equal(await imageStatus(nextId), 200);

    // Entfernen: kein Cover mehr im EPUB
    assert.equal(
      ((await (await patch({ coverImageId: null })).json()) as ProjectInfo).coverImageId,
      null,
    );
    assert.equal(await imageStatus(nextId), 404);
    const withoutCover = await JSZip.loadAsync((await exportTo('epub', 'roman')).data);
    assert.equal(withoutCover.file('OEBPS/text/cover.xhtml'), null);
  });

  it('behält ein Titelbild, das auch im Text vorkommt', async () => {
    const nodes = await api<ManuscriptNode[]>('GET', '/api/nodes');
    const scene = nodes.find((node) => node.title === 'Markt')!;
    const shared = await upload(PNG_1PX, 'beides.png');
    const sharedId = shared.split('/').pop()!;
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc: {
        type: 'doc',
        content: [
          paragraph(text('Am Markt roch es nach Fisch.')),
          { type: 'image', attrs: { src: shared } },
        ],
      },
      text: '',
      wordCount: 6,
    });
    await api('PATCH', '/api/project', { coverImageId: sharedId });
    await api('PATCH', '/api/project', { coverImageId: null });
    const response = await fetch(`${server.url}/api/images/${sharedId}`, {
      headers: { [AUTH_HEADER]: TOKEN },
    });
    assert.equal(response.status, 200, 'Bild wird in der Szene noch gebraucht');
    await api('PUT', `/api/scenes/${scene.id}/content`, {
      doc: { type: 'doc', content: [paragraph(text('Am Markt roch es nach Fisch.'))] },
      text: '',
      wordCount: 6,
    });
  });

  it('erzeugt PDFs mit pdfLaTeX (wenn installiert)', { timeout: 240_000 }, async (t) => {
    if (!pdfAvailable) {
      t.skip('pdfLaTeX ist nicht installiert');
      return;
    }
    const a5: BookLayout = {
      ...DEFAULT_LAYOUT,
      pageWidth: 148,
      pageHeight: 210,
      font: 'times',
      fontSize: 12,
    };
    for (const [template, size, layout] of [
      ['normseite', /595\.\d* x 841\.\d* pts|595\.276 x 841\.89 pts/, undefined], // A4
      ['roman', /354\.\d* x 538\.\d* pts/, undefined], // 125 × 190 mm
      ['roman', /419\.\d* x 595\.\d* pts/, a5], // 148 × 210 mm
    ] as const) {
      const { data, filePath, warnings } = await exportTo('pdf', template, false, layout);
      assert.equal(data.subarray(0, 5).toString(), '%PDF-');
      assert.ok(
        warnings.some((w) => w.includes('WEBP')),
        'WebP-Hinweis',
      );
      assert.ok(
        warnings.some((w) => w.startsWith('9 Zeichen')), // 😀 + die 8 Buchstaben von „Ελληνικά“
        `Hinweis auf 😀 und Griechisch: ${warnings}`,
      );
      if (hasTool('pdfinfo')) {
        assert.match(execFileSync('pdfinfo', [filePath]).toString(), size);
      }
      if (hasTool('pdftotext')) {
        // Zeilenumbrüche/Mehrfach-Leerzeichen zusammenfassen – die Normseite bricht nach 60 Zeichen um
        const pdfText = execFileSync('pdftotext', [filePath, '-']).toString().replace(/\s+/g, ' ');
        for (const needle of [
          'Die Häuser am Fluss',
          'Ankunft',
          'Am Markt roch es nach Fisch',
          '100 % & $ # _ ~ \\ <<Tag>> "Zitat" ,,unten“',
          'Ein Stand war leer.',
        ]) {
          assert.ok(pdfText.includes(needle), `${template}: „${needle}“ fehlt im PDF`);
        }
      }
    }
  });

  it('liefert ohne Pfad die Datei als Download (Browser-Modus)', async () => {
    const response = await fetch(`${server.url}/api/export`, {
      method: 'POST',
      headers: {
        [AUTH_HEADER]: TOKEN,
        'Content-Type': 'application/json',
        // Hinweise in der Sprache der Oberfläche
        'Accept-Language': 'en',
      },
      body: JSON.stringify({ format: 'docx', template: 'roman', includeSceneTitles: false }),
    });
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get('content-disposition') ?? '',
      /Die%20H%C3%A4user%20am%20Fluss\.docx/,
    );
    const warnings = JSON.parse(
      decodeURIComponent(response.headers.get('x-export-warnings') ?? ''),
    );
    assert.deepEqual(warnings, ['Image “Foto” (WEBP) cannot be included in Word.']);
    assert.equal(
      Buffer.from(await response.arrayBuffer())
        .subarray(0, 2)
        .toString(),
      'PK',
    ); // ZIP
  });

  it('weist ungültige Anfragen ab', async () => {
    const status = async (body: object) =>
      (
        await fetch(`${server.url}/api/export`, {
          method: 'POST',
          headers: { [AUTH_HEADER]: TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      ).status;
    assert.equal(await status({ format: 'odt', template: 'roman' }), 400);
    assert.equal(
      await status({ format: 'html', template: 'roman', filePath: 'relativ.html' }),
      400,
    );
  });
});

describe('Satzspiegel', () => {
  it('legt Zahlen in ihre Grenzen und lässt immer Platz für Text', () => {
    assert.deepEqual(sanitizeLayout(undefined), DEFAULT_LAYOUT);
    const tiny = sanitizeLayout({ ...DEFAULT_LAYOUT, pageWidth: 10, fontSize: 99 });
    assert.equal(tiny.pageWidth, 80);
    assert.equal(tiny.fontSize, 18);
    // 80 mm breit mit 20 + 15 mm Rand ließe 45 mm – genug; bei 60 + 60 mm wird geschrumpft
    const squeezed = sanitizeLayout({ ...DEFAULT_LAYOUT, marginInner: 60, marginOuter: 60 });
    assert.ok(squeezed.pageWidth - squeezed.marginInner - squeezed.marginOuter >= 40);
    assert.equal(squeezed.marginInner, squeezed.marginOuter);
  });
});

describe('LaTeX-Hilfen', () => {
  it('setzt Computer Modern mit cm-super und weicht sonst auf Latin Modern aus', () => {
    const book = { title: 'T', author: '', wordCount: 0, characterCount: 0, items: [] };
    const { tex } = renderLatex(book, 'roman', { includeSceneTitles: false }, () => null, {
      ...DEFAULT_LAYOUT,
      font: 'computermodern',
    });
    assert.ok(
      tex.includes(
        String.raw`\IfFileExists{type1ec.sty}{\usepackage{type1ec}}{\IfFileExists{lmodern.sty}{\usepackage{lmodern}}{}}`,
      ),
    );
  });

  it('escapt Sonderzeichen und ersetzt nicht darstellbare Zeichen', () => {
    const ctx = { unsupported: 0 };
    assert.equal(
      escape('100 % & $ # _ ~ \\ {x} ^ <<a>> "b" `c ,,d', ctx),
      String.raw`100 \% \& \$ \# \_ \textasciitilde{} \textbackslash{} \{x\} \textasciicircum{} \textless{}\textless{}a\textgreater{}\textgreater{} \textquotedbl{}b\textquotedbl{} \textasciigrave{}c ,{},d`,
    );
    assert.equal(escape('Größe – „gut“ … €', ctx), 'Größe – „gut“ … €');
    // Anführungszeichen aller Stile, die der Editor setzt
    assert.equal(
      escape('»a« ›b‹ ‚c‘ “d” ‘e’ «\u202ff\u202f» ‹g›', ctx),
      '»a« ›b‹ ‚c‘ “d” ‘e’ «\\,f\\,» ‹g›',
    );
    assert.equal(escape('Hi 😀 Ω', ctx), 'Hi ? ?');
    assert.equal(ctx.unsupported, 2);
  });

  it('übersetzt typische LaTeX-Fehler in verständliche Meldungen', () => {
    assert.match(
      describeLatexError("! LaTeX Error: File `tgpagella.sty' not found.\n").de,
      /Paket „tgpagella\.sty“ fehlt/,
    );
    assert.match(
      describeLatexError("! LaTeX Error: File `tgpagella.sty' not found.\n").en,
      /package “tgpagella\.sty” is missing/,
    );
    assert.match(
      describeLatexError('...\n! Undefined control sequence.\n').en,
      /Undefined control sequence/,
    );
  });
});
