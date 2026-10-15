import JSZip from 'jszip';
import type { Book, ExportOptions, ImageResolver, ResolvedImage } from './book.js';
import { BLOCK_FORMAT_CSS, contentHtml, escapeHtml } from './html-renderer.js';
import { type Localized, localized } from '../i18n.js';

export interface EpubMeta {
  /** Stays the same for a book across exports so readers can match new editions. */
  identifier: string;
  modified: Date;
  /** Without it, readers show only a neutral tile in the library. */
  cover: ResolvedImage | null;
}

/**
 * Image formats every EPUB 3 reader must display ("core media types"). WebP is one since EPUB 3.3;
 * AVIF is not.
 */
const CORE_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const STYLE = `@charset "utf-8";
body { margin: 0 5%; font-family: serif; line-height: 1.45; }
section.title-page { margin-top: 30%; text-align: center; }
section.title-page h1 { font-weight: normal; font-size: 2em; margin: 0; }
section.title-page p { margin: 1em 0 0; font-style: italic; text-align: center; text-indent: 0; }
section.part { margin-top: 35%; text-align: center; }
section.part h1 { font-weight: normal; font-size: 1.7em; }
h2.chapter { font-weight: normal; font-size: 1.45em; text-align: center; margin: 3em 0 2em; }
h3.scene-title { font-size: 1.1em; margin: 2em 0 0.8em; }
h4, h5 { margin: 1.5em 0 0.5em; }
p { margin: 0; text-align: justify; -epub-hyphens: auto; hyphens: auto; }
p + p { text-indent: 1.5em; }
p.scene-break { text-align: center; text-indent: 0; margin: 1.2em 0; }
p.scene-break + p { text-indent: 0; }
blockquote { margin: 1em 1.5em; font-style: italic; }
figure { margin: 1.5em 0; text-align: center; }
figure img { max-width: 100%; max-height: 90vh; }
body.cover { margin: 0; padding: 0; text-align: center; }
body.cover svg { display: block; width: 100%; height: 100%; }
body.cover img { max-width: 100%; max-height: 100%; }
${BLOCK_FORMAT_CSS}`;

interface Chapter {
  id: string;
  fileName: string;
  title: string;
  /** For parts: their chapters, for the nested table of contents. */
  children: Chapter[];
}

/**
 * EPUB 3 with one file per part and chapter, a nav.xhtml and – for older readers – an additional
 * toc.ncx. Each image source is stored only once.
 */
export async function renderEpub(
  book: Book,
  options: ExportOptions,
  images: ImageResolver,
  meta: EpubMeta,
): Promise<{ data: Buffer; warnings: Localized[] }> {
  const warnings: Localized[] = [];
  const zip = new JSZip();
  // Must be the first entry and uncompressed – that is how readers recognise the format.
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file('META-INF/container.xml', CONTAINER_XML);

  const manifest: string[] = [];
  const spine: string[] = [];
  const toc: Chapter[] = [];
  /** Image `src` → reference from the chapter file (`null` = left out). */
  const imageFiles = new Map<string, string | null>();

  const imageSource = (src: string): string | null => {
    if (imageFiles.has(src)) return imageFiles.get(src)!;
    const image = images(src);
    let fileName: string | null = null;
    if (image) {
      const extension = CORE_IMAGE_TYPES[image.mimeType];
      if (extension) {
        const id = `bild-${imageFiles.size + 1}`;
        fileName = `images/${id}.${extension}`;
        zip.file(`OEBPS/${fileName}`, image.data);
        manifest.push(item(id, fileName, image.mimeType));
      } else {
        const format = image.mimeType.replace('image/', '').toUpperCase();
        warnings.push(
          localized(
            `Ein Bild (${format}) können E-Book-Reader nicht anzeigen und wurde weggelassen.`,
            `An image (${format}) cannot be displayed by e-book readers and was left out.`,
          ),
        );
      }
    }
    const href = fileName && `../${fileName}`;
    imageFiles.set(src, href);
    return href;
  };

  const addPage = (id: string, title: string, body: string, bodyClass?: string): Chapter => {
    const fileName = `text/${id}.xhtml`;
    zip.file(`OEBPS/${fileName}`, page(title, body, bodyClass));
    // Pages with embedded SVG must declare it in the manifest
    const properties = body.includes('<svg') ? 'svg' : undefined;
    manifest.push(item(id, fileName, 'application/xhtml+xml', properties));
    spine.push(`<itemref idref="${id}"/>`);
    return { id, fileName, title, children: [] };
  };

  let hasCover = false;
  if (meta.cover) {
    const extension = CORE_IMAGE_TYPES[meta.cover.mimeType];
    if (extension) {
      const fileName = `images/titelbild.${extension}`;
      zip.file(`OEBPS/${fileName}`, meta.cover.data);
      manifest.push(item('titelbild', fileName, meta.cover.mimeType, 'cover-image'));
      addPage('cover', book.title, coverBody(`../${fileName}`, meta.cover, book.title), 'cover');
      hasCover = true;
    } else {
      const format = meta.cover.mimeType.replace('image/', '').toUpperCase();
      warnings.push(
        localized(
          `Das Titelbild (${format}) können E-Book-Reader nicht anzeigen und wurde weggelassen.`,
          `The cover image (${format}) cannot be displayed by e-book readers and was left out.`,
        ),
      );
    }
  }

  addPage(
    'titel',
    book.title,
    `<section class="title-page" epub:type="titlepage"><h1>${escapeHtml(book.title)}</h1>${
      book.author ? `<p>${escapeHtml(book.author)}</p>` : ''
    }</section>`,
  );

  let currentPart: Chapter | null = null;
  let partCount = 0;
  let chapterCount = 0;
  for (const entry of book.items) {
    if (entry.kind === 'part') {
      currentPart = addPage(
        `teil-${++partCount}`,
        entry.title,
        `<section class="part" epub:type="part"><h1>${escapeHtml(entry.title)}</h1></section>`,
      );
      toc.push(currentPart);
      continue;
    }
    const scenes = entry.scenes.map((scene, index) => {
      const heading = options.includeSceneTitles
        ? `<h3 class="scene-title">${escapeHtml(scene.title)}</h3>`
        : index > 0
          ? '<p class="scene-break" aria-hidden="true">* * *</p>'
          : '';
      return heading + contentHtml(scene.doc.content ?? [], imageSource);
    });
    const chapter = addPage(
      `kapitel-${++chapterCount}`,
      entry.title,
      `<section epub:type="chapter"><h2 class="chapter">${escapeHtml(entry.title)}</h2>${scenes.join('')}</section>`,
    );
    (currentPart ? currentPart.children : toc).push(chapter);
  }

  zip.file('OEBPS/styles.css', STYLE);
  zip.file('OEBPS/nav.xhtml', navDocument(book, toc, hasCover));
  zip.file('OEBPS/toc.ncx', ncxDocument(book, meta, toc));
  zip.file('OEBPS/content.opf', packageDocument(book, meta, manifest, spine, hasCover));

  const data = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
    mimeType: 'application/epub+zip',
  });
  return { data, warnings };
}

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

/**
 * With known dimensions as SVG, which scales cleanly without distortion in every reader; otherwise
 * as a plain image.
 */
function coverBody(href: string, image: ResolvedImage, title: string): string {
  const alt = escapeHtml(title);
  if (!image.width || !image.height) {
    return `<section epub:type="cover"><img src="${href}" alt="${alt}"/></section>`;
  }
  return `<section epub:type="cover"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${image.width} ${image.height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${alt}"><image width="${image.width}" height="${image.height}" xlink:href="${href}"/></svg></section>`;
}

function page(title: string, body: string, bodyClass?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de" lang="de">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" type="text/css" href="../styles.css"/>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${body}
</body>
</html>
`;
}

function item(id: string, href: string, mediaType: string, properties?: string): string {
  return `<item id="${id}" href="${href}" media-type="${mediaType}"${
    properties ? ` properties="${properties}"` : ''
  }/>`;
}

function packageDocument(
  book: Book,
  meta: EpubMeta,
  manifest: string[],
  spine: string[],
  hasCover: boolean,
): string {
  // dcterms:modified requires second precision without milliseconds
  const modified = meta.modified.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const creator = book.author
    ? `\n    <dc:creator id="autor">${escapeHtml(book.author)}</dc:creator>
    <meta refines="#autor" property="role" scheme="marc:relators">aut</meta>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="buch-id" xml:lang="de">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="buch-id">${escapeHtml(meta.identifier)}</dc:identifier>
    <dc:title>${escapeHtml(book.title)}</dc:title>${creator}
    <dc:language>de</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
    <meta name="generator" content="Wortomat"/>${
      // For EPUB 2 readers that do not know `properties="cover-image"`
      hasCover ? '\n    <meta name="cover" content="titelbild"/>' : ''
    }
  </metadata>
  <manifest>
    ${item('nav', 'nav.xhtml', 'application/xhtml+xml', 'nav')}
    ${item('ncx', 'toc.ncx', 'application/x-dtbncx+xml')}
    ${item('css', 'styles.css', 'text/css')}
    ${manifest.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spine.join('\n    ')}
  </spine>
</package>
`;
}

function navDocument(book: Book, toc: Chapter[], hasCover: boolean): string {
  const list = (entries: Chapter[]): string =>
    `<ol>${entries
      .map(
        (entry) =>
          `<li><a href="${entry.fileName}">${escapeHtml(entry.title)}</a>${
            entry.children.length ? list(entry.children) : ''
          }</li>`,
      )
      .join('')}</ol>`;
  const first = toc[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="de" lang="de">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(book.title)}</title>
</head>
<body>
<nav epub:type="toc" id="toc">
<h1>Inhalt</h1>
${toc.length ? list(toc) : '<ol><li><a href="text/titel.xhtml">Titel</a></li></ol>'}
</nav>
<nav epub:type="landmarks" hidden="">
<ol>${hasCover ? '\n<li><a epub:type="cover" href="text/cover.xhtml">Titelbild</a></li>' : ''}
<li><a epub:type="titlepage" href="text/titel.xhtml">Titel</a></li>${
    first ? `\n<li><a epub:type="bodymatter" href="${first.fileName}">Beginn</a></li>` : ''
  }
</ol>
</nav>
</body>
</html>
`;
}

/** Some older readers only read this EPUB 2 table of contents. */
function ncxDocument(book: Book, meta: EpubMeta, toc: Chapter[]): string {
  let order = 0;
  const points = (entries: Chapter[]): string =>
    entries
      .map(
        (entry) =>
          `<navPoint id="nav-${entry.id}" playOrder="${++order}"><navLabel><text>${escapeHtml(
            entry.title,
          )}</text></navLabel><content src="${entry.fileName}"/>${points(entry.children)}</navPoint>`,
      )
      .join('\n');
  const entries = toc.length
    ? toc
    : [{ id: 'titel', fileName: 'text/titel.xhtml', title: book.title, children: [] }];
  const depth = entries.some((entry) => entry.children.length) ? 2 : 1;
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="de">
<head>
<meta name="dtb:uid" content="${escapeHtml(meta.identifier)}"/>
<meta name="dtb:depth" content="${depth}"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${escapeHtml(book.title)}</text></docTitle>
<navMap>
${points(entries)}
</navMap>
</ncx>
`;
}
