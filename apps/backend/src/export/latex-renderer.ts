import type { BookLayout, ExportTemplate } from '@wortomat/shared';
import type { Book, ExportOptions, ImageResolver, JsonNode } from './book.js';
import { normseitenLabel, printMarks } from './book.js';
import { BOOK_FONTS, DEFAULT_LAYOUT } from './layout.js';
import { type Localized, localized } from '../i18n.js';

export interface LatexDocument {
  tex: string;
  /** Extra files (images) next to the .tex file. */
  files: Map<string, Buffer>;
  warnings: Localized[];
}

/*
 * Preambles. On purpose only packages from the usual base installations (TeX Live "recommended",
 * MiKTeX Basic); nicer things (book fonts, microtype) only when present.
 */

/**
 * Standard page: Courier 12 pt, 30 lines of 60 characters. Courier is 0.6 em wide → 60 × 7.2 pt =
 * 432 pt; 30 lines of 18 pt → type area height 29 × 18 pt + \topskip (12 pt) = 534 pt.
 * Standardised, so not configurable.
 */
const NORMSEITE_PREAMBLE = String.raw`\documentclass[12pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[ngerman]{babel}
\usepackage{graphicx}
\usepackage[a4paper,left=2.5cm,top=3cm,textwidth=432pt,textheight=534pt,headheight=15pt,headsep=24pt]{geometry}
\usepackage{fancyhdr}
% Unterstreichen/Durchstreichen mit Zeilenumbruch; ohne ulem bleibt nur \underline bzw. nichts
\IfFileExists{ulem.sty}{\usepackage[normalem]{ulem}\newcommand{\wmuline}[1]{\uline{##1}}\newcommand{\wmstrike}[1]{\sout{##1}}}{\newcommand{\wmuline}[1]{\underline{##1}}\newcommand{\wmstrike}[1]{##1}}
\renewcommand{\ttdefault}{pcr}
\renewcommand{\familydefault}{\ttdefault}
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\hyphenpenalty=10000
\exhyphenpenalty=10000
\frenchspacing
\AtBeginDocument{\shorthandoff{"}\fontsize{12pt}{18pt}\selectfont\raggedright\setlength{\parindent}{21.6pt}\setlength{\parskip}{0pt}}
\newcommand{\wmpart}[1]{\clearpage\vspace*{8\baselineskip}\begin{center}\textbf{#1}\end{center}\clearpage}
\newcommand{\wmchapter}[1]{\clearpage\begin{center}\textbf{#1}\end{center}\vspace{\baselineskip}}
\newcommand{\wmscenetitle}[1]{\par\vspace{\baselineskip}\noindent\textbf{#1}\par\nopagebreak}
\newcommand{\wmscenebreak}{\par\noindent\hfill*\hfill\null\par}
`;

/**
 * Novel: two-sided book typesetting, justified with German hyphenation. Page size, margins, font
 * and font size come from the book's type area.
 */
function romanPreamble(layout: BookLayout): string {
  const mm = (value: number) => `${value}mm`;
  // Base size of the class (10/11/12 pt) as close as possible to the chosen one: the heading sizes
  // (\Large etc.) depend on it.
  const classSize = layout.fontSize < 10.5 ? 10 : layout.fontSize < 11.5 ? 11 : 12;
  // Line spacing as in the book class (11 pt on 13.6 pt); \linespread is added on top
  const baseline = Math.round(layout.fontSize * (13.6 / 11) * 100) / 100;
  // Distance from the end of the text to the page number; must fit into the bottom margin
  const footskip = Math.round(Math.min(10, Math.max(4, layout.marginBottom * 0.45)) * 10) / 10;
  // Chosen font, else Latin Modern (or the default font as a last resort)
  const font = BOOK_FONTS[layout.font].latex.reduceRight(
    (fallback, name) => `\\IfFileExists{${name}.sty}{\\usepackage{${name}}}{${fallback}}`,
    '\\IfFileExists{lmodern.sty}{\\usepackage{lmodern}}{}',
  );
  const geometry = [
    `paperwidth=${mm(layout.pageWidth)}`,
    `paperheight=${mm(layout.pageHeight)}`,
    `inner=${mm(layout.marginInner)}`,
    `outer=${mm(layout.marginOuter)}`,
    `top=${mm(layout.marginTop)}`,
    `bottom=${mm(layout.marginBottom)}`,
    `footskip=${mm(footskip)}`,
  ].join(',');
  return String.raw`\documentclass[${classSize}pt,twoside,openany]{book}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[ngerman]{babel}
\usepackage{graphicx}
\usepackage[${geometry}]{geometry}
${font}
\IfFileExists{microtype.sty}{\usepackage{microtype}}{}
\usepackage{fancyhdr}
% Unterstreichen/Durchstreichen mit Zeilenumbruch; ohne ulem bleibt nur \underline bzw. nichts
\IfFileExists{ulem.sty}{\usepackage[normalem]{ulem}\newcommand{\wmuline}[1]{\uline{##1}}\newcommand{\wmstrike}[1]{\sout{##1}}}{\newcommand{\wmuline}[1]{\underline{##1}}\newcommand{\wmstrike}[1]{##1}}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot[C]{\small\thepage}
\renewcommand{\headrulewidth}{0pt}
\fancypagestyle{plain}{\fancyhf{}\fancyfoot[C]{\small\thepage}\renewcommand{\headrulewidth}{0pt}}
\makeatletter
% Leere Seiten vor einem neuen Teil (rechte Seite) ohne Seitenzahl
\renewcommand{\cleardoublepage}{\clearpage\if@twoside\ifodd\c@page\else\hbox{}\thispagestyle{empty}\newpage\fi\fi}
% Grundschrift in der gewählten Größe (auch dort, wo LaTeX \normalsize neu setzt)
\renewcommand{\normalsize}{\@setfontsize\normalsize{${layout.fontSize}pt}{${baseline}pt}}
\makeatother
\linespread{1.08}
\setlength{\parindent}{1.2em}
\setlength{\parskip}{0pt}
\clubpenalty=10000
\widowpenalty=10000
\AtBeginDocument{\shorthandoff{"}\normalsize}
\newcommand{\wmpart}[1]{\cleardoublepage\thispagestyle{empty}\vspace*{0.3\textheight}\begin{center}\LARGE #1\end{center}\clearpage}
\newcommand{\wmchapter}[1]{\clearpage\thispagestyle{plain}\vspace*{0.15\textheight}\begin{center}\Large #1\end{center}\vspace{2\baselineskip}}
\newcommand{\wmscenetitle}[1]{\par\bigskip\noindent\textit{#1}\par\nopagebreak\smallskip}
\newcommand{\wmscenebreak}{\par\bigskip\noindent\hfill*\quad*\quad*\hfill\null\par\bigskip}
`;
}

export function renderLatex(
  book: Book,
  template: ExportTemplate,
  options: ExportOptions,
  images: ImageResolver,
  layout: BookLayout = DEFAULT_LAYOUT,
): LatexDocument {
  const ctx: Context = {
    images,
    files: new Map(),
    warnings: [],
    unsupported: 0,
    indentNext: false,
  };
  const out: string[] = [template === 'normseite' ? NORMSEITE_PREAMBLE : romanPreamble(layout)];
  if (template === 'normseite') {
    // Standard page header: "Author: Title" left, page number right
    const header = [book.author, book.title]
      .filter(Boolean)
      .map((t) => escape(t, ctx))
      .join(': ');
    out.push(`\\fancyhead[L]{${header}}`, '\\fancyhead[R]{\\thepage}');
  }
  out.push('\\begin{document}', titlePage(book, template, ctx));

  for (const item of book.items) {
    if (item.kind === 'part') {
      out.push(`\\wmpart{${escape(item.title, ctx)}}`);
      continue;
    }
    out.push(`\\wmchapter{${escape(item.title, ctx)}}`);
    item.scenes.forEach((scene, index) => {
      if (options.includeSceneTitles) out.push(`\\wmscenetitle{${escape(scene.title, ctx)}}`);
      else if (index > 0) out.push('\\wmscenebreak');
      ctx.indentNext = false;
      out.push(blocks(scene.doc.content ?? [], ctx));
    });
  }
  out.push('\\end{document}', '');

  if (ctx.unsupported > 0) {
    ctx.warnings.push(
      localized(
        `${ctx.unsupported} Zeichen (z. B. Emoji oder nicht-lateinische Schrift) kann pdfLaTeX nicht darstellen; sie erscheinen als „?“.`,
        `pdfLaTeX cannot display ${ctx.unsupported} characters (e.g. emoji or non-Latin script); they appear as “?”.`,
      ),
    );
  }
  return { tex: out.join('\n'), files: ctx.files, warnings: ctx.warnings };
}

interface Context {
  images: ImageResolver;
  files: Map<string, Buffer>;
  warnings: Localized[];
  unsupported: number;
  indentNext: boolean;
}

function titlePage(book: Book, template: ExportTemplate, ctx: Context): string {
  const title = escape(book.title, ctx);
  const author = escape(book.author, ctx);
  if (template === 'normseite') {
    const stats = `ca. ${book.wordCount.toLocaleString('de-DE')} Wörter, ca. ${normseitenLabel(book)}`;
    return String.raw`\begin{titlepage}
\noindent ${author || '~'}\hfill ${escape(stats, ctx)}\par
\vspace*{8\baselineskip}
\begin{center}\textbf{${title}}${author ? String.raw`\par\vspace{\baselineskip}von ${author}` : ''}\end{center}
\end{titlepage}`;
  }
  return String.raw`\begin{titlepage}
\vspace*{0.25\textheight}
\begin{center}{\Huge ${title}\par}${author ? String.raw`\vspace{2\baselineskip}{\large\itshape ${author}\par}` : ''}\end{center}
\end{titlepage}`;
}

function blocks(nodes: JsonNode[], ctx: Context): string {
  return nodes
    .map((node) => block(node, ctx))
    .filter(Boolean)
    .join('\n\n');
}

function block(node: JsonNode, ctx: Context): string {
  switch (node.type) {
    case 'paragraph': {
      const text = inline(node.content ?? [], ctx).trim();
      if (!text) return '';
      const prefix = ctx.indentNext ? '' : '\\noindent ';
      ctx.indentNext = true;
      return prefix + text;
    }
    case 'heading':
      ctx.indentNext = false;
      return `\\par\\medskip\\noindent\\textbf{${inline(node.content ?? [], ctx)}}\\par\\nopagebreak\\smallskip`;
    case 'blockquote':
      ctx.indentNext = false;
      return `\\begin{quote}\\itshape\n${blocks(node.content ?? [], ctx)}\n\\end{quote}`;
    case 'bulletList':
    case 'orderedList': {
      const env = node.type === 'bulletList' ? 'itemize' : 'enumerate';
      const start = Number(node.attrs?.['start'] ?? 1);
      const items = (node.content ?? [])
        .map((item) => {
          ctx.indentNext = true; // no \noindent in list items
          return `\\item ${blocks(item.content ?? [], ctx)}`;
        })
        .join('\n');
      ctx.indentNext = false;
      const counter =
        env === 'enumerate' && start !== 1 ? `\\setcounter{enumi}{${start - 1}}\n` : '';
      return `\\begin{${env}}\n${counter}${items}\n\\end{${env}}`;
    }
    case 'codeBlock': {
      ctx.indentNext = false;
      const lines = (node.content ?? [])
        .map((t) => t.text ?? '')
        .join('')
        .split('\n')
        .map((line) => escape(line, ctx) || '~');
      return `\\begin{flushleft}\\ttfamily\n${lines.join('\\\\\n')}\n\\end{flushleft}`;
    }
    case 'horizontalRule':
      ctx.indentNext = false;
      return '\\wmscenebreak';
    case 'image':
      ctx.indentNext = false;
      return image(node, ctx);
    default:
      return node.content ? blocks(node.content, ctx) : '';
  }
}

function image(node: JsonNode, ctx: Context): string {
  const altText = String(node.attrs?.['alt'] ?? '');
  const alt = altText || 'ohne Namen';
  const resolved = ctx.images(String(node.attrs?.['src'] ?? ''));
  // pdfLaTeX can only include PNG, JPEG and PDF.
  const extension =
    resolved?.mimeType === 'image/png' ? 'png' : resolved?.mimeType === 'image/jpeg' ? 'jpg' : null;
  if (!resolved || !extension) {
    const format = resolved?.mimeType.replace('image/', '').toUpperCase();
    ctx.warnings.push(
      localized(
        `Bild „${alt}“ (${format ?? 'unbekannt'}) kann pdfLaTeX nicht einbinden.`,
        `pdfLaTeX cannot include image “${altText || 'unnamed'}” (${format ?? 'unknown'}).`,
      ),
    );
    return `\\begin{center}\\itshape [Bild: ${escape(alt, ctx)}]\\end{center}`;
  }
  const name = `bild-${ctx.files.size + 1}.${extension}`;
  ctx.files.set(name, resolved.data);
  return `\\begin{center}\\includegraphics[width=\\linewidth,height=0.5\\textheight,keepaspectratio]{${name}}\\end{center}`;
}

function inline(nodes: JsonNode[], ctx: Context): string {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      // \newline at the start of a paragraph is an error in LaTeX – just leave it out there.
      if (out.trim()) out += '\\newline\n';
      continue;
    }
    if (node.type !== 'text' || !node.text) continue;
    let text = escape(node.text, ctx);
    const marks = printMarks(node);
    if (marks.has('code')) text = `\\texttt{${text}}`;
    if (marks.has('strike')) text = `\\wmstrike{${text}}`;
    if (marks.has('underline')) text = `\\wmuline{${text}}`;
    if (marks.has('italic')) text = `\\emph{${text}}`;
    if (marks.has('bold')) text = `\\textbf{${text}}`;
    out += text;
  }
  return out;
}

/** Punctuation allowed on top of Latin-1 and Latin Extended-A (all defined in T1/utf8). */
const EXTRA_CHARACTERS = new Set('–—‘’‚“”„…•‹›«»€†‡′″');

const REPLACEMENTS: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  $: '\\$',
  '&': '\\&',
  '#': '\\#',
  '%': '\\%',
  _: '\\_',
  '^': '\\textasciicircum{}',
  '~': '\\textasciitilde{}',
  '<': '\\textless{}', // otherwise "<<" and ">>" form guillemets in T1
  '>': '\\textgreater{}',
  '|': '\\textbar{}',
  '"': '\\textquotedbl{}', // with ngerman, " is a control character
  '`': '\\textasciigrave{}', // prevents the ligatures !` and ?`
  '\t': ' ',
  '\u202f': '\\,', // narrow no-break space (French quotation marks)
};

/** Characters that cannot be typeset become "?". */
export function escape(text: string, ctx: { unsupported: number }): string {
  let out = '';
  for (const char of text.normalize('NFC')) {
    const code = char.codePointAt(0)!;
    if (REPLACEMENTS[char] !== undefined) out += REPLACEMENTS[char];
    else if (
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0x17f) ||
      EXTRA_CHARACTERS.has(char)
    )
      out += char;
    else if (code === 0x0a) out += ' ';
    else {
      ctx.unsupported++;
      out += '?';
    }
  }
  // ",," would become „ in T1 – break up the comma ligature
  return out.replaceAll(',,', ',{},');
}
