import {
  AlignmentType,
  Document,
  Footer,
  Header,
  ImageRun,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  type ParagraphChild,
  Tab,
  TabStopType,
  TextRun,
} from 'docx';
import JSZip from 'jszip';
import type { BookLayout, ExportTemplate } from '@wortomat/shared';
import type { Book, ExportOptions, ImageResolver, JsonNode } from './book.js';
import { fitImage, normseitenLabel, printMarks } from './book.js';
import { BOOK_FONTS, DEFAULT_LAYOUT } from './layout.js';
import { type Localized, localized } from '../i18n.js';

/** Measurements in twips (1/20 pt; 1 cm = 567 twips). */
interface Layout {
  page: { width: number; height: number };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    header: number;
    footer: number;
  };
  font: string;
  /** In half points. */
  size: number;
  /** Exact (standard page) or a multiple (240 = single). */
  line: number;
  lineRule: (typeof LineRuleType)[keyof typeof LineRuleType];
  align: (typeof AlignmentType)[keyof typeof AlignmentType];
  indent: number;
  hyphenate: boolean;
  sceneBreak: string;
  /**
   * Standard page: author and title at the top, page number right; novel: page number bottom
   * centre.
   */
  pageNumbers: 'header' | 'footer';
  /** Two-sided: left = inner (gutter), right = outer; Word mirrors them on even pages. */
  mirrorMargins: boolean;
}

/**
 * Standard page: Courier 12 pt, exactly 30 lines of 60 characters on A4. Courier is 7.2 pt wide →
 * 60 characters = 432 pt = 8640 twips text width; 30 lines of 18 pt = 540 pt = 10800 twips text
 * height. The margins follow from that.
 */
const NORMSEITE: Layout = {
  page: { width: 11906, height: 16838 },
  margin: {
    top: 1418,
    right: 11906 - 1418 - 8640,
    bottom: 16838 - 1418 - 10800,
    left: 1418,
    header: 709,
    footer: 709,
  },
  font: 'Courier New',
  size: 24,
  line: 360,
  // EXACT, not EXACTLY: the latter writes lineRule="exactly", which the Word format does not know.
  lineRule: LineRuleType.EXACT,
  align: AlignmentType.LEFT,
  indent: 432, // 3 characters
  hyphenate: false,
  sceneBreak: '*',
  pageNumbers: 'header',
  mirrorMargins: false,
};

const TWIPS_PER_MM = 1440 / 25.4;

/** Novel: page size from the book's type area, justified with hyphenation. */
function romanLayout(book: BookLayout): Layout {
  const twips = (mm: number) => Math.round(mm * TWIPS_PER_MM);
  const top = twips(book.marginTop);
  const bottom = twips(book.marginBottom);
  return {
    page: { width: twips(book.pageWidth), height: twips(book.pageHeight) },
    margin: {
      top,
      right: twips(book.marginOuter),
      bottom,
      left: twips(book.marginInner),
      header: Math.min(567, Math.max(0, top - 170)),
      // Page number a good 1 cm above the bottom edge – lower for small margins
      footer: Math.max(170, Math.min(680, bottom - 340)),
    },
    font: BOOK_FONTS[book.font].docx,
    size: Math.round(book.fontSize * 2),
    line: 276,
    lineRule: LineRuleType.AUTO,
    align: AlignmentType.BOTH,
    // a good 1.2 em, as in the PDF
    indent: Math.round((340 * book.fontSize) / 11),
    hyphenate: true,
    sceneBreak: '*   *   *',
    pageNumbers: 'footer',
    mirrorMargins: true,
  };
}

const TWIPS_PER_PIXEL = 15; // docx measures images in pixels of 1/96 inch

export async function renderDocx(
  book: Book,
  template: ExportTemplate,
  options: ExportOptions,
  images: ImageResolver,
  bookLayout: BookLayout = DEFAULT_LAYOUT,
): Promise<{ data: Buffer; warnings: Localized[] }> {
  const layout = template === 'normseite' ? NORMSEITE : romanLayout(bookLayout);
  const warnings: Localized[] = [];
  const textWidth = layout.page.width - layout.margin.left - layout.margin.right;
  const textHeight = layout.page.height - layout.margin.top - layout.margin.bottom;
  const ctx: Context = {
    layout,
    images,
    warnings,
    maxImage: { width: textWidth / TWIPS_PER_PIXEL, height: (textHeight / TWIPS_PER_PIXEL) * 0.7 },
    indentNext: false,
    textHeight,
  };

  const body: Paragraph[] = [];
  for (const item of book.items) {
    if (item.kind === 'part') {
      body.push(
        newPageSpacer(Math.round(textHeight / 3)),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          // The standard page stays 12 pt Courier throughout; in the novel layout the part title
          // may be larger.
          children: [
            layout === NORMSEITE
              ? new TextRun({ text: item.title, bold: true })
              : new TextRun({ text: item.title, size: layout.size + 12 }),
          ],
        }),
      );
      continue;
    }
    body.push(...chapterHeading(item.title, ctx));
    item.scenes.forEach((scene, index) => {
      if (options.includeSceneTitles) {
        body.push(
          new Paragraph({
            keepNext: true,
            spacing: { before: index > 0 ? layout.line : 0 },
            children: [new TextRun({ text: scene.title, bold: true })],
          }),
        );
      } else if (index > 0) {
        body.push(sceneBreak(ctx));
      }
      ctx.indentNext = false;
      body.push(...blocks(scene.doc.content ?? [], ctx));
    });
  }

  const headerText = [book.author, book.title].filter(Boolean).join(': ');
  const document = new Document({
    creator: book.author || 'Wortomat',
    title: book.title,
    description: 'Erstellt mit Wortomat',
    features: { updateFields: false },
    hyphenation: { autoHyphenation: layout.hyphenate, consecutiveHyphenLimit: 2 },
    styles: {
      default: {
        document: {
          run: { font: layout.font, size: layout.size, language: { value: 'de-DE' } },
          paragraph: {
            spacing: { line: layout.line, lineRule: layout.lineRule, before: 0, after: 0 },
          },
        },
      },
    },
    sections: [
      {
        properties: { page: { size: layout.page, margin: layout.margin } },
        children: titlePage(book, template, ctx, textHeight),
      },
      {
        properties: {
          page: { size: layout.page, margin: layout.margin, pageNumbers: { start: 1 } },
        },
        headers:
          layout.pageNumbers === 'header'
            ? {
                default: new Header({
                  children: [
                    new Paragraph({
                      tabStops: [{ type: TabStopType.RIGHT, position: textWidth }],
                      children: [
                        new TextRun({ children: [headerText, new Tab(), PageNumber.CURRENT] }),
                      ],
                    }),
                  ],
                }),
              }
            : undefined,
        footers:
          layout.pageNumbers === 'footer'
            ? {
                default: new Footer({
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ children: [PageNumber.CURRENT], size: layout.size - 4 }),
                      ],
                    }),
                  ],
                }),
              }
            : undefined,
        children: body,
      },
    ],
  });

  const data = await Packer.toBuffer(document);
  return { data: layout.mirrorMargins ? await withMirrorMargins(data) : data, warnings };
}

/**
 * The docx library does not support mirrored margins, so `<w:mirrorMargins/>` is added to
 * word/settings.xml afterwards. The schema puts it before every other setting docx writes (except
 * `w:displayBackgroundShape`).
 */
async function withMirrorMargins(data: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(data);
  const file = zip.file('word/settings.xml');
  if (!file) return data;
  const xml = await file.async('string');
  if (xml.includes('<w:mirrorMargins')) return data;
  const background = /<w:displayBackgroundShape\b[^>]*\/>/.exec(xml);
  const insertAt = background
    ? background.index + background[0].length
    : xml.indexOf('>', xml.indexOf('<w:settings')) + 1;
  zip.file(
    'word/settings.xml',
    xml.slice(0, insertAt) + '<w:mirrorMargins/>' + xml.slice(insertAt),
  );
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

interface Context {
  layout: Layout;
  images: ImageResolver;
  warnings: Localized[];
  maxImage: { width: number; height: number };
  /** Indent only from the second paragraph after a heading or scene break. */
  indentNext: boolean;
  textHeight: number;
}

function titlePage(
  book: Book,
  template: ExportTemplate,
  ctx: Context,
  textHeight: number,
): Paragraph[] {
  const { layout } = ctx;
  const stats = `ca. ${book.wordCount.toLocaleString('de-DE')} Wörter · ca. ${normseitenLabel(book)}`;
  const result: Paragraph[] = [];
  if (template === 'normseite') {
    // Classic layout: author top left, length top right, title centred
    result.push(new Paragraph({ children: [new TextRun(book.author || ' ')] }));
    result.push(new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(stats)] }));
  }
  result.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: Math.round(textHeight / 3) },
      children: [
        new TextRun({
          text: book.title,
          bold: template === 'normseite' || undefined,
          size: layout.size + (template === 'roman' ? 20 : 0),
        }),
      ],
    }),
  );
  if (book.author) {
    result.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: layout.line },
        children: [
          new TextRun({
            text: template === 'normseite' ? `von ${book.author}` : book.author,
            italics: template === 'roman' || undefined,
          }),
        ],
      }),
    );
  }
  return result;
}

function chapterHeading(title: string, ctx: Context): Paragraph[] {
  const { layout } = ctx;
  ctx.indentNext = false;
  return layout === NORMSEITE
    ? [
        new Paragraph({
          pageBreakBefore: true,
          keepNext: true,
          alignment: AlignmentType.CENTER,
          spacing: { after: layout.line * 2 },
          children: [new TextRun({ text: title, bold: true })],
        }),
      ]
    : [
        // as in the PDF: chapter openings start 15 % of the type area lower
        newPageSpacer(Math.round(ctx.textHeight * 0.15)),
        new Paragraph({
          keepNext: true,
          alignment: AlignmentType.CENTER,
          spacing: { after: 700 },
          children: [new TextRun({ text: title, size: layout.size + 10 })],
        }),
      ];
}

/**
 * Word and LibreOffice drop "space before" right after a page break – an empty paragraph with a
 * fixed height is always kept.
 */
function newPageSpacer(height: number): Paragraph {
  return new Paragraph({
    pageBreakBefore: true,
    keepNext: true,
    spacing: { line: height, lineRule: LineRuleType.EXACT, before: 0, after: 0 },
    children: [],
  });
}

function sceneBreak(ctx: Context): Paragraph {
  ctx.indentNext = false;
  const spacing = ctx.layout === NORMSEITE ? 0 : 240;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: spacing, after: spacing },
    children: [new TextRun(ctx.layout.sceneBreak)],
  });
}

function blocks(nodes: JsonNode[], ctx: Context, extra: ParagraphExtra = {}): Paragraph[] {
  return nodes.flatMap((node) => block(node, ctx, extra));
}

interface ParagraphExtra {
  indentLeft?: number;
  italics?: boolean;
  prefix?: string;
}

function block(node: JsonNode, ctx: Context, extra: ParagraphExtra): Paragraph[] {
  const { layout } = ctx;
  switch (node.type) {
    case 'paragraph': {
      const children = inline(node.content ?? [], extra.italics ?? false);
      if (!children.length) return [];
      const firstLine = extra.indentLeft || extra.prefix ? 0 : ctx.indentNext ? layout.indent : 0;
      ctx.indentNext = true;
      return [
        new Paragraph({
          alignment: extra.prefix ? AlignmentType.LEFT : layout.align,
          indent: {
            firstLine,
            left: extra.indentLeft ?? 0,
            hanging: extra.prefix ? 284 : undefined,
          },
          children: extra.prefix ? [new TextRun(extra.prefix), ...children] : children,
        }),
      ];
    }
    case 'heading':
      ctx.indentNext = false;
      return [
        new Paragraph({
          keepNext: true,
          spacing: { before: layout.line, after: layout === NORMSEITE ? 0 : 120 },
          children: inline(node.content ?? [], false).map((run) => run),
        }),
      ];
    case 'blockquote': {
      const result = blocks(node.content ?? [], ctx, {
        ...extra,
        indentLeft: (extra.indentLeft ?? 0) + 567,
        italics: true,
      });
      ctx.indentNext = false;
      return result;
    }
    case 'bulletList':
    case 'orderedList': {
      let number = Number(node.attrs?.['start'] ?? 1);
      const result = (node.content ?? []).flatMap((item) => {
        const prefix = node.type === 'bulletList' ? '•\t' : `${number++}.\t`;
        return blocks(item.content ?? [], ctx, {
          ...extra,
          indentLeft: (extra.indentLeft ?? 0) + 567,
          prefix,
        });
      });
      ctx.indentNext = false;
      return result;
    }
    case 'codeBlock':
      ctx.indentNext = false;
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: (node.content ?? []).map((t) => t.text ?? '').join(''),
              font: 'Courier New',
            }),
          ],
        }),
      ];
    case 'horizontalRule':
      return [sceneBreak(ctx)];
    case 'image':
      ctx.indentNext = false;
      return [imageParagraph(node, ctx)];
    default:
      return node.content ? blocks(node.content, ctx, extra) : [];
  }
}

function imageParagraph(node: JsonNode, ctx: Context): Paragraph {
  const src = String(node.attrs?.['src'] ?? '');
  const alt = String(node.attrs?.['alt'] ?? '');
  const image = ctx.images(src);
  const type =
    image?.mimeType === 'image/jpeg'
      ? 'jpg'
      : image?.mimeType === 'image/png'
        ? 'png'
        : image?.mimeType === 'image/gif'
          ? 'gif'
          : null;
  if (!image || !type) {
    const format = image?.mimeType.replace('image/', '').toUpperCase();
    ctx.warnings.push(
      localized(
        `Bild „${alt || 'ohne Namen'}“ (${format ?? 'unbekannt'}) kann in Word nicht übernommen werden.`,
        `Image “${alt || 'unnamed'}” (${format ?? 'unknown'}) cannot be included in Word.`,
      ),
    );
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `[Bild: ${alt || 'ohne Namen'}]`, italics: true })],
    });
  }
  const size = fitImage(image, ctx.maxImage.width, ctx.maxImage.height);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    children: [
      new ImageRun({
        type,
        data: image.data,
        transformation: size,
        altText: { name: alt, description: alt, title: alt },
      }),
    ],
  });
}

function inline(nodes: JsonNode[], italicsDefault: boolean): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      runs.push(new TextRun({ text: '', break: 1 }));
    } else if (node.type === 'text' && node.text) {
      const marks = printMarks(node);
      runs.push(
        new TextRun({
          text: node.text,
          // only set what applies – otherwise every run says "bold: no, italic: no …"
          bold: marks.has('bold') || undefined,
          italics: marks.has('italic') !== italicsDefault || undefined, // italic inside a quote turns upright
          underline: marks.has('underline') ? {} : undefined,
          strike: marks.has('strike') || undefined,
          font: marks.has('code') ? 'Courier New' : undefined,
        }),
      );
    }
  }
  return runs;
}
