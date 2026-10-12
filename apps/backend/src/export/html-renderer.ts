import type { Book, ExportOptions, ImageResolver, JsonNode } from './book.js';
import { printMarks } from './book.js';

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
  @media print {
    body { background: none; }
    section.part, section.chapter { break-before: page; }
  }
`;

/** Eine eigenständige HTML-Datei: Bilder sind eingebettet, kein Netz nötig. */
export function renderHtml(book: Book, options: ExportOptions, images: ImageResolver): Buffer {
  const parts: string[] = [];
  parts.push(
    `<header class="title"><h1>${escape(book.title)}</h1>${
      book.author ? `<p>${escape(book.author)}</p>` : ''
    }</header>`,
  );

  for (const item of book.items) {
    if (item.kind === 'part') {
      parts.push(`<section class="part"><h1>${escape(item.title)}</h1></section>`);
      continue;
    }
    const scenes = item.scenes.map((scene, index) => {
      const heading = options.includeSceneTitles
        ? `<h3 class="scene-title">${escape(scene.title)}</h3>`
        : index > 0
          ? '<p class="scene-break" aria-hidden="true">* * *</p>'
          : '';
      return heading + blocks(scene.doc.content ?? [], images);
    });
    parts.push(
      `<section class="chapter"><h2>${escape(item.title)}</h2>${scenes.join('')}</section>`,
    );
  }

  const author = book.author ? `<meta name="author" content="${escape(book.author)}">` : '';
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(book.title)}</title>
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

function blocks(nodes: JsonNode[], images: ImageResolver): string {
  return nodes.map((node) => block(node, images)).join('');
}

function block(node: JsonNode, images: ImageResolver): string {
  switch (node.type) {
    case 'paragraph':
      return `<p>${inline(node.content ?? [])}</p>`;
    case 'heading':
      return node.attrs?.['level'] === 3
        ? `<h5>${inline(node.content ?? [])}</h5>`
        : `<h4>${inline(node.content ?? [])}</h4>`;
    case 'blockquote':
      return `<blockquote>${blocks(node.content ?? [], images)}</blockquote>`;
    case 'bulletList':
      return `<ul>${blocks(node.content ?? [], images)}</ul>`;
    case 'orderedList': {
      const start = Number(node.attrs?.['start'] ?? 1);
      return `<ol${start !== 1 ? ` start="${start}"` : ''}>${blocks(node.content ?? [], images)}</ol>`;
    }
    case 'listItem':
      return `<li>${blocks(node.content ?? [], images)}</li>`;
    case 'codeBlock':
      return `<pre><code>${escape((node.content ?? []).map((t) => t.text ?? '').join(''))}</code></pre>`;
    case 'horizontalRule':
      return '<p class="scene-break" aria-hidden="true">* * *</p>';
    case 'image': {
      const src = String(node.attrs?.['src'] ?? '');
      const image = images(src);
      if (!image) return '';
      const alt = escape(String(node.attrs?.['alt'] ?? ''));
      const data = `data:${image.mimeType};base64,${image.data.toString('base64')}`;
      return `<figure><img src="${data}" alt="${alt}"></figure>`;
    }
    default:
      return node.content ? blocks(node.content, images) : '';
  }
}

function inline(nodes: JsonNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '<br>';
      if (node.type !== 'text') return '';
      let html = escape(node.text ?? '');
      const marks = printMarks(node);
      if (marks.has('code')) html = `<code>${html}</code>`;
      if (marks.has('strike')) html = `<s>${html}</s>`;
      if (marks.has('underline')) html = `<u>${html}</u>`;
      if (marks.has('italic')) html = `<em>${html}</em>`;
      if (marks.has('bold')) html = `<strong>${html}</strong>`;
      if (marks.has('link')) {
        const href = String(node.marks?.find((m) => m.type === 'link')?.attrs?.['href'] ?? '');
        if (/^(https?:|mailto:)/i.test(href)) html = `<a href="${escape(href)}">${html}</a>`;
      }
      return html;
    })
    .join('');
}

function escape(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
