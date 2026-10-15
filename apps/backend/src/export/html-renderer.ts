import type { Book, ExportOptions, ImageResolver, JsonNode } from './book.js';
import { blockFormat, linkHref, printMarks } from './book.js';

/** Rules for the classes of `formatClass`, shared by the HTML and EPUB stylesheets. */
export const BLOCK_FORMAT_CSS = `
.align-left { text-align: left; }
.align-center { text-align: center; text-indent: 0; }
.align-right { text-align: right; text-indent: 0; }
.align-justify { text-align: justify; }
.indent-1 { margin-left: 2em; }
.indent-2 { margin-left: 4em; }
.indent-3 { margin-left: 6em; }
.indent-4 { margin-left: 8em; }
`;

const STYLE = `
  :root { color-scheme: light; }
  body { margin: 0; background: #fbfaf7; color: #22201c;
    font: 1.15rem/1.7 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; }
  main { max-width: 36em; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  header.title { text-align: center; margin: 4rem 0 6rem; }
  header.title h1 { font-weight: 400; font-size: 2.6rem; margin: 0; }
  header.title p { margin: 1rem 0 0; font-style: italic; }
  section.part h1 { text-align: center; font-weight: 400; font-size: 1.9rem; margin: 6rem 0 4rem; }
  section.chapter > h2 { text-align: center; font-weight: 400; font-size: 1.6rem; margin: 5rem 0 2.5rem; }
  h3.scene-title { font-size: 1.1rem; margin: 2.5rem 0 1rem; }
  h4, h5 { margin: 1.5rem 0 0.5rem; }
  p { margin: 0; text-align: justify; hyphens: auto; }
  p + p { text-indent: 1.5em; }
  p.scene-break { text-align: center; margin: 1.5rem 0; letter-spacing: 0.6em; }
  blockquote { margin: 1rem 1.5rem; font-style: italic; }
  figure { margin: 1.5rem 0; text-align: center; }
  figure img { max-width: 100%; height: auto; }
  ${BLOCK_FORMAT_CSS}
  @media print {
    body { background: none; }
    section.part, section.chapter { break-before: page; }
  }
`;

/** Self-contained: images are embedded, no network needed. */
export function renderHtml(book: Book, options: ExportOptions, images: ImageResolver): Buffer {
  const embedImage = (src: string) => {
    const image = images(src);
    return image ? `data:${image.mimeType};base64,${image.data.toString('base64')}` : null;
  };
  const parts: string[] = [];
  parts.push(
    `<header class="title"><h1>${escapeHtml(book.title)}</h1>${
      book.author ? `<p>${escapeHtml(book.author)}</p>` : ''
    }</header>`,
  );

  for (const item of book.items) {
    if (item.kind === 'part') {
      parts.push(`<section class="part"><h1>${escapeHtml(item.title)}</h1></section>`);
      continue;
    }
    const scenes = item.scenes.map((scene, index) => {
      const heading = options.includeSceneTitles
        ? `<h3 class="scene-title">${escapeHtml(scene.title)}</h3>`
        : index > 0
          ? '<p class="scene-break" aria-hidden="true">* * *</p>'
          : '';
      return heading + contentHtml(scene.doc.content ?? [], embedImage);
    });
    parts.push(
      `<section class="chapter"><h2>${escapeHtml(item.title)}</h2>${scenes.join('')}</section>`,
    );
  }

  const author = book.author ? `<meta name="author" content="${escapeHtml(book.author)}">` : '';
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(book.title)}</title>
${author}
<meta name="generator" content="Wortomat">
<style>${STYLE}</style>
</head>
<body>
<main>
${parts.join('\n')}
</main>
</body>
</html>
`;
  return Buffer.from(html, 'utf8');
}

/**
 * Address of an image in the export (data URI, path in the EPUB …), or `null` when the image is
 * left out.
 */
export type ImageSource = (src: string) => string | null;

/** The output is valid XHTML as well (`<br/>`, `<img … />`) so the EPUB can use it too. */
export function contentHtml(nodes: JsonNode[], image: ImageSource): string {
  return nodes.map((node) => block(node, image)).join('');
}

function block(node: JsonNode, image: ImageSource): string {
  switch (node.type) {
    case 'paragraph':
      return `<p${formatClass(node)}>${inline(node.content ?? [])}</p>`;
    case 'heading': {
      const tag = node.attrs?.['level'] === 3 ? 'h5' : 'h4';
      return `<${tag}${formatClass(node)}>${inline(node.content ?? [])}</${tag}>`;
    }
    case 'blockquote':
      return `<blockquote>${contentHtml(node.content ?? [], image)}</blockquote>`;
    case 'bulletList':
      return `<ul>${contentHtml(node.content ?? [], image)}</ul>`;
    case 'orderedList': {
      const start = Number(node.attrs?.['start'] ?? 1);
      return `<ol${start !== 1 ? ` start="${start}"` : ''}>${contentHtml(node.content ?? [], image)}</ol>`;
    }
    case 'listItem':
      return `<li>${contentHtml(node.content ?? [], image)}</li>`;
    case 'codeBlock':
      return `<pre><code>${escapeHtml((node.content ?? []).map((t) => t.text ?? '').join(''))}</code></pre>`;
    case 'horizontalRule':
      return '<p class="scene-break" aria-hidden="true">* * *</p>';
    case 'image': {
      const src = image(String(node.attrs?.['src'] ?? ''));
      if (!src) return '';
      const alt = escapeHtml(String(node.attrs?.['alt'] ?? ''));
      return `<figure><img src="${escapeHtml(src)}" alt="${alt}"/></figure>`;
    }
    default:
      return node.content ? contentHtml(node.content, image) : '';
  }
}

function inline(nodes: JsonNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '<br/>';
      if (node.type !== 'text') return '';
      let html = escapeHtml(node.text ?? '');
      const marks = printMarks(node);
      if (marks.has('code')) html = `<code>${html}</code>`;
      if (marks.has('strike')) html = `<s>${html}</s>`;
      if (marks.has('underline')) html = `<u>${html}</u>`;
      if (marks.has('italic')) html = `<em>${html}</em>`;
      if (marks.has('bold')) html = `<strong>${html}</strong>`;
      const href = marks.has('link') ? linkHref(node) : null;
      if (href) html = `<a href="${escapeHtml(href)}">${html}</a>`;
      return html;
    })
    .join('');
}

/** Classes instead of inline styles, so the EPUB's and the preview's stylesheets decide the look. */
function formatClass(node: JsonNode): string {
  const { align, indent } = blockFormat(node);
  const classes = [align && `align-${align}`, indent && `indent-${indent}`].filter(Boolean);
  return classes.length ? ` class="${classes.join(' ')}"` : '';
}

/** Control characters that XML forbids are dropped. */
export function escapeHtml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
