/// <reference lib="dom" />
import type { ProofNote, ProofNotesFile, ProofPackage, ProofScene } from '@wortomat/shared';

/**
 * Runs on the phone, offline, inside a single HTML file: `readerHtml()` embeds the source of this
 * function as a script.
 *
 * So everything must live in here – no imports (except types), no helpers from outside. The data
 * comes from `<script id="proof-data">`.
 */
export function readerApp(): void {
  /** Only the phone needs the position (for highlighting). */
  interface LocalNote extends ProofNote {
    start: number;
    end: number;
  }

  type View =
    { name: 'home' } | { name: 'chapter'; chapter: number } | { name: 'notes' } | { name: 'plot' };

  interface State {
    notes: LocalNote[];
    chapter: number | null;
    scroll: number;
    sentAt: string | null;
    sentCount: number;
    fontScale: number;
    /** Plot view: only turning points. */
    plotOnlyTurningPoints?: boolean;
  }

  interface Selected {
    sceneId: string;
    paragraph: number;
    start: number;
    end: number;
    quote: string;
  }

  const CONTEXT = 32;
  const DB_NAME = 'wortomat-proof';

  const data = document.getElementById('proof-data')?.textContent ?? '{}';
  const pkg = JSON.parse(data) as ProofPackage;

  const german = (navigator.language || 'de').toLowerCase().startsWith('de');
  const T = german
    ? {
        proofCopy: 'Korrekturfassung',
        exported: (date: string) => `Stand vom ${date}`,
        resume: (title: string) => `Weiterlesen: ${title}`,
        chapters: 'Kapitel',
        chapter: (n: number) => `Kapitel ${n}`,
        notes: 'Notizen',
        noNotes:
          'Noch keine Notizen. Markiere beim Lesen eine Stelle und tippe auf „Notiz“ oder „Vorschlag“.',
        note: 'Notiz',
        suggestion: 'Vorschlag',
        replaceWith: 'Ersetzen durch',
        reason: 'Begründung (optional)',
        noteText: 'Notiz',
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        back: 'Übersicht',
        previous: '← Vorheriges Kapitel',
        next: 'Nächstes Kapitel →',
        send: 'Notizen senden',
        sendHint: (count: number, unsent: number, sent: string | null) =>
          `${count === 1 ? '1 Notiz' : `${count} Notizen`}` +
          (sent ? ` · zuletzt gesendet ${sent}` : ' · noch nie gesendet') +
          (unsent > 0 && sent ? ` · ${unsent} neu seither` : ''),
        sent: 'Gesendet. Am Rechner unter „Korrektur unterwegs“ übernehmen.',
        downloaded:
          'Gespeichert in „Downloads“. Am Rechner unter „Korrektur unterwegs“ übernehmen.',
        emptyNote: 'Bitte eine Notiz schreiben.',
        unchanged:
          'Der Ersatztext ist noch derselbe wie vorher. Ändere ihn – oder brich ab und wähle „Notiz“.',
        oneParagraph: 'Bitte nur innerhalb eines Absatzes markieren.',
        overlaps: 'Hier gibt es schon eine Notiz – tippe sie an, um sie zu ändern.',
        storageFailed:
          'Achtung: Diese Datei kann sich hier nichts merken. Sende deine Notizen, bevor du sie schließt.',
        fontSize: 'Schriftgröße',
        smaller: 'Kleiner',
        larger: 'Größer',
        deleteSuggestion: 'leer lassen = streichen',
        quoteOf: (quote: string) => `„${quote}“`,
        replaceShort: (quote: string, by: string) =>
          by ? `„${quote}“ → „${by}“` : `„${quote}“ streichen`,
        plot: 'Handlung',
        plotEntry: 'Handlung ansehen',
        plotHint: 'Jeder Strang eine Linie, von oben nach unten. Tippe auf eine Szene.',
        allScenes: 'Alle Szenen',
        turningPoints: (count: number) => `Wendepunkte (${count})`,
        turningPoint: 'Wendepunkt',
        noStrand: 'Ohne Strang',
        bookPosition: (number: number) => `im Buch Szene ${number}`,
        toText: 'Zum Text',
        close: 'Schließen',
      }
    : {
        proofCopy: 'Proofreading copy',
        exported: (date: string) => `As of ${date}`,
        resume: (title: string) => `Continue: ${title}`,
        chapters: 'Chapters',
        chapter: (n: number) => `Chapter ${n}`,
        notes: 'Notes',
        noNotes: 'No notes yet. While reading, select a passage and tap “Note” or “Suggestion”.',
        note: 'Note',
        suggestion: 'Suggestion',
        replaceWith: 'Replace with',
        reason: 'Reason (optional)',
        noteText: 'Note',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        back: 'Overview',
        previous: '← Previous chapter',
        next: 'Next chapter →',
        send: 'Send notes',
        sendHint: (count: number, unsent: number, sent: string | null) =>
          `${count === 1 ? '1 note' : `${count} notes`}` +
          (sent ? ` · last sent ${sent}` : ' · never sent') +
          (unsent > 0 && sent ? ` · ${unsent} new since` : ''),
        sent: 'Sent. On your computer, bring them in under “Proofread on the go”.',
        downloaded:
          'Saved to “Downloads”. On your computer, bring them in under “Proofread on the go”.',
        emptyNote: 'Please write a note.',
        unchanged:
          'The replacement is still the same text. Change it – or cancel and choose “Note”.',
        oneParagraph: 'Please select within a single paragraph.',
        overlaps: 'There is already a note here – tap it to change it.',
        storageFailed:
          'Careful: this file cannot remember anything here. Send your notes before closing it.',
        fontSize: 'Font size',
        smaller: 'Smaller',
        larger: 'Larger',
        deleteSuggestion: 'leave empty = delete',
        quoteOf: (quote: string) => `“${quote}”`,
        replaceShort: (quote: string, by: string) =>
          by ? `“${quote}” → “${by}”` : `Delete “${quote}”`,
        plot: 'Plot',
        plotEntry: 'View the plot',
        plotHint: 'Each plot thread is a line from top to bottom. Tap a scene.',
        allScenes: 'All scenes',
        turningPoints: (count: number) => `Turning points (${count})`,
        turningPoint: 'Turning point',
        noStrand: 'No thread',
        bookPosition: (number: number) => `scene ${number} in the book`,
        toText: 'Go to text',
        close: 'Close',
      };

  const dateFormat = new Intl.DateTimeFormat(german ? 'de' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const formatDate = (iso: string) => dateFormat.format(new Date(iso));

  type Child = Node | string | null | undefined | false;
  function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: Record<string, unknown> = {},
    ...children: Child[]
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.slice(2), value as EventListener);
      } else if (key === 'class') {
        element.className = String(value);
      } else if (key in element && typeof value !== 'string') {
        (element as unknown as Record<string, unknown>)[key] = value;
      } else {
        element.setAttribute(key, String(value));
      }
    }
    for (const child of children) {
      if (child === null || child === undefined || child === false) continue;
      element.append(child);
    }
    return element;
  }

  const newId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  // State lives in IndexedDB per proofreading copy (localStorage does not always persist on
  // Android)

  let state: State = {
    notes: [],
    chapter: null,
    scroll: 0,
    sentAt: null,
    sentCount: 0,
    fontScale: 1,
  };
  let db: IDBDatabase | null = null;
  let storageOk = true;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function loadState(): Promise<State | null> {
    return new Promise((resolve) => {
      if (!db) return resolve(null);
      const get = db.transaction('state').objectStore('state').get(pkg.id);
      get.onsuccess = () => resolve((get.result as State | undefined) ?? null);
      get.onerror = () => resolve(null);
    });
  }

  function saveNow(): void {
    clearTimeout(saveTimer);
    if (!db) return;
    try {
      db.transaction('state', 'readwrite').objectStore('state').put(state, pkg.id);
    } catch {
      storageOk = false;
      render();
    }
  }

  function save(): void {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 300);
  }

  const header = h('header', { class: 'bar' });
  const main = h('main', { id: 'main' });
  const actions = h('div', { class: 'actions', hidden: true });
  const sheet = h('div', { class: 'sheet-backdrop', hidden: true });
  const toast = h('div', { class: 'toast', role: 'status', hidden: true });
  document.body.append(header, main, actions, sheet, toast);

  let view: View = { name: 'home' };
  let selected: Selected | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(text: string): void {
    toast.textContent = text;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 4000);
  }

  /** With a history entry, so Android's back gesture goes back. */
  function go(next: View): void {
    history.pushState(next, '');
    show(next);
  }

  function show(next: View, scroll = 0): void {
    view = next;
    hideActions();
    if (next.name === 'chapter') {
      state.chapter = next.chapter;
      save();
    }
    render();
    window.scrollTo(0, scroll);
  }

  window.addEventListener('popstate', (event) => {
    show((event.state as View | null) ?? { name: 'home' });
  });

  function render(): void {
    document.documentElement.style.setProperty('--font-scale', String(state.fontScale));
    renderHeader();
    // The plot's thread names stick right below the bar
    document.documentElement.style.setProperty('--bar-height', `${header.offsetHeight}px`);
    main.replaceChildren(
      ...(storageOk ? [] : [h('p', { class: 'warning' }, T.storageFailed)]),
      ...(view.name === 'home'
        ? renderHome()
        : view.name === 'notes'
          ? renderNotes()
          : view.name === 'plot'
            ? renderPlot()
            : renderChapter(view.chapter)),
    );
  }

  function renderHeader(): void {
    const count = state.notes.length;
    header.replaceChildren(
      view.name === 'home'
        ? h('span', { class: 'bar-title' }, pkg.title)
        : h(
            'button',
            { type: 'button', class: 'link', onclick: () => history.back() },
            `← ${T.back}`,
          ),
      h(
        'button',
        {
          type: 'button',
          class: 'link notes-button',
          'aria-pressed': String(view.name === 'notes'),
          onclick: () => (view.name === 'notes' ? history.back() : go({ name: 'notes' })),
        },
        T.notes,
        count ? h('span', { class: 'badge' }, String(count)) : null,
      ),
    );
  }

  function notesIn(chapterIndex: number): LocalNote[] {
    const ids = new Set(pkg.chapters[chapterIndex]?.scenes.map((scene) => scene.id));
    return state.notes.filter((note) => ids.has(note.sceneId));
  }

  function renderHome(): Node[] {
    const resume = state.chapter !== null ? pkg.chapters[state.chapter] : undefined;
    const list = h('ol', { class: 'chapters' });
    let part: string | null = null;
    pkg.chapters.forEach((chapter, index) => {
      if (chapter.part && chapter.part !== part) {
        list.append(h('li', { class: 'part' }, chapter.part));
      }
      part = chapter.part;
      const count = notesIn(index).length;
      list.append(
        h(
          'li',
          {},
          h(
            'button',
            { type: 'button', onclick: () => go({ name: 'chapter', chapter: index }) },
            h('span', { class: 'number' }, String(chapter.number)),
            h('span', { class: 'chapter-title' }, chapter.title),
            count ? h('span', { class: 'badge' }, String(count)) : null,
          ),
        ),
      );
    });
    return [
      h(
        'section',
        { class: 'cover' },
        h('p', { class: 'kicker' }, T.proofCopy),
        h('h1', {}, pkg.title),
        pkg.author ? h('p', { class: 'author' }, pkg.author) : null,
        h('p', { class: 'muted' }, T.exported(formatDate(pkg.exportedAt))),
        resume
          ? h(
              'button',
              {
                type: 'button',
                class: 'primary',
                onclick: () => {
                  history.pushState({ name: 'chapter', chapter: state.chapter }, '');
                  show({ name: 'chapter', chapter: state.chapter! }, state.scroll);
                },
              },
              T.resume(resume.title),
            )
          : null,
      ),
      sendSection(),
      ...(hasPlot
        ? [
            h(
              'button',
              { type: 'button', class: 'plot-entry', onclick: () => go({ name: 'plot' }) },
              T.plotEntry,
            ),
          ]
        : []),
      h('h2', {}, T.chapters),
      list,
      h(
        'div',
        { class: 'font-size' },
        h('span', { class: 'muted' }, T.fontSize),
        h(
          'button',
          { type: 'button', 'aria-label': T.smaller, onclick: () => setFont(-0.1) },
          'A−',
        ),
        h('button', { type: 'button', 'aria-label': T.larger, onclick: () => setFont(0.1) }, 'A+'),
      ),
    ];
  }

  function setFont(delta: number): void {
    state.fontScale = Math.min(1.6, Math.max(0.8, Math.round((state.fontScale + delta) * 10) / 10));
    save();
    render();
  }

  function sendSection(): Node {
    const count = state.notes.length;
    const unsent = count - state.sentCount;
    return h(
      'section',
      { class: 'send' },
      h(
        'p',
        { class: 'muted' },
        T.sendHint(count, unsent, state.sentAt && formatDate(state.sentAt)),
      ),
      h(
        'button',
        { type: 'button', class: 'primary', disabled: count === 0, onclick: sendNotes },
        T.send,
      ),
    );
  }

  function renderChapter(index: number): Node[] {
    const chapter = pkg.chapters[index];
    if (!chapter) return [];
    const nodes: Node[] = [
      h('p', { class: 'kicker' }, T.chapter(chapter.number)),
      h('h1', { class: 'chapter-heading' }, chapter.title),
    ];
    for (const scene of chapter.scenes) {
      const article = h(
        'article',
        { class: 'scene', 'data-scene': scene.id },
        h('h2', { class: 'scene-title' }, scene.title),
      );
      scene.paragraphs.forEach((text, paragraph) => {
        const element = h('p', {
          class: text ? 'para' : 'para empty',
          'data-scene': scene.id,
          'data-paragraph': String(paragraph),
        });
        fillParagraph(element, text, scene.id, paragraph);
        article.append(element);
      });
      nodes.push(article);
    }
    nodes.push(
      h(
        'nav',
        { class: 'chapter-nav' },
        index > 0
          ? h(
              'button',
              { type: 'button', onclick: () => go({ name: 'chapter', chapter: index - 1 }) },
              T.previous,
            )
          : h('span'),
        index < pkg.chapters.length - 1
          ? h(
              'button',
              { type: 'button', onclick: () => go({ name: 'chapter', chapter: index + 1 }) },
              T.next,
            )
          : h('span'),
      ),
    );
    return nodes;
  }

  // --- Plot view: the threads from top to bottom, as on the computer (vertical, compact) ---

  interface PlotEntry {
    scene: ProofScene;
    chapterIndex: number;
    /** Position in the book (from 1). */
    number: number;
  }

  /** All scenes in book order. */
  const entries: PlotEntry[] = pkg.chapters.flatMap((chapter, chapterIndex) =>
    chapter.scenes.map((scene) => ({ scene, chapterIndex, number: 0 })),
  );
  entries.forEach((entry, index) => (entry.number = index + 1));
  const strands = pkg.strands ?? [];
  const hasPlot = strands.length > 0 && entries.length > 0;

  /** Width of one thread's column: fills the screen, within reason. */
  let laneWidth = 44;
  const ROW = 34;
  const NODE = 20;
  const BUNDLE_GAP = 7;
  const BEND = 22;
  const GROUP_GAP = 30;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svg(
    tag: string,
    attrs: Record<string, string | number>,
    ...children: Node[]
  ): SVGElement {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    element.append(...children);
    return element;
  }

  /**
   * Same rule as on the computer: placed scenes by their position (same position = simultaneous),
   * never placed ones right after the scene before them in the book.
   */
  function storyColumns(): Array<{ entries: PlotEntry[]; position: number | null }> {
    const placed = new Map<number, PlotEntry[]>();
    const following = new Map<number | null, PlotEntry[]>();
    let anchor: number | null = null;
    for (const entry of entries) {
      const position = entry.scene.storyOrder ?? null;
      if (position === null) {
        following.set(anchor, [...(following.get(anchor) ?? []), entry]);
      } else {
        anchor = position;
        placed.set(position, [...(placed.get(position) ?? []), entry]);
      }
    }
    type Column = { entries: PlotEntry[]; position: number | null };
    const loose = (key: number | null): Column[] =>
      (following.get(key) ?? []).map((entry) => ({ entries: [entry], position: null }));
    const columns = loose(null);
    for (const position of [...placed.keys()].sort((a, b) => a - b)) {
      columns.push({ entries: placed.get(position)!, position }, ...loose(position));
    }
    return columns;
  }

  interface PlotNode {
    entry: PlotEntry;
    x: number;
    y: number;
    /** Across the lanes: wider for scenes in several threads. */
    width: number;
  }

  function plotLayout(onlyTurningPoints: boolean) {
    const laneIndex = new Map(strands.map((strand, index) => [strand.id, index]));
    const lanesOf = (entry: PlotEntry) =>
      (entry.scene.strandIds ?? [])
        .filter((id) => laneIndex.has(id))
        .map((id) => laneIndex.get(id)!)
        .sort((a, b) => a - b);
    const visible = (entry: PlotEntry) => !onlyTurningPoints || entry.scene.turningPoint;
    const unassigned = entries.some((entry) => visible(entry) && lanesOf(entry).length === 0);
    const laneCount = strands.length + (unassigned ? 1 : 0);
    const laneX = (index: number) => index * laneWidth + laneWidth / 2;

    // Groups: story sections once something is arranged, otherwise chapters
    const arranged = entries.some((entry) => entry.scene.storyOrder !== null);
    const marks = [...(pkg.storyMarks ?? [])].sort((a, b) => a.position - b.position);
    const groupOf = (column: { entries: PlotEntry[]; position: number | null }): string | null => {
      if (!arranged) {
        const chapter = pkg.chapters[column.entries[0]!.chapterIndex]!;
        return `${chapter.number} · ${chapter.title}`;
      }
      if (column.position === null) return null; // stays in the section it follows
      let label: string | null = null;
      for (const mark of marks) if (mark.position <= column.position) label = mark.label;
      return label;
    };

    const nodes: PlotNode[] = [];
    const groups: Array<{ label: string; y: number }> = [];
    const together: Array<{ top: number; bottom: number }> = [];
    const anchors = new Map<number, Array<{ x: number; y: number }>>();
    let y = 8;
    let group: string | null = null;
    for (const column of storyColumns()) {
      const shown = column.entries.filter(visible);
      if (!shown.length) continue;
      const label: string | null = groupOf(column) ?? group;
      if (label !== group && label !== null) {
        y += GROUP_GAP;
        groups.push({ label, y: y - 10 });
      }
      group = label;
      // Side by side where they do not touch, otherwise one row each
      const rows: Array<Array<{ left: number; right: number }>> = [];
      const top = y;
      const placed = shown
        .map((entry) => {
          const lanes = lanesOf(entry);
          const own = lanes.length ? lanes : [strands.length];
          const x = own.reduce((sum, lane) => sum + laneX(lane), 0) / own.length;
          return { entry, lanes, x, width: NODE + Math.max(0, lanes.length - 1) * BUNDLE_GAP };
        })
        .sort((a, b) => a.x - b.x);
      for (const node of placed) {
        const left = node.x - node.width / 2 - 4;
        const right = node.x + node.width / 2 + 4;
        let row = rows.findIndex((taken) => taken.every((o) => right <= o.left || left >= o.right));
        if (row < 0) row = rows.push([]) - 1;
        rows[row]!.push({ left, right });
        const nodeY = top + row * ROW + ROW / 2;
        nodes.push({ entry: node.entry, x: node.x, y: nodeY, width: node.width });
        node.lanes.forEach((lane, index) => {
          const offset = (index - (node.lanes.length - 1) / 2) * BUNDLE_GAP;
          const points = anchors.get(lane) ?? [];
          points.push({ x: node.x + offset, y: nodeY });
          anchors.set(lane, points);
        });
      }
      y = top + rows.length * ROW;
      if (shown.length > 1) together.push({ top, bottom: y });
    }

    const lines = strands.flatMap((strand, lane) => {
      const points = anchors.get(lane) ?? [];
      return points.length < 2 ? [] : [{ strand, path: linePath(points, laneX(lane)) }];
    });
    return {
      width: laneCount * laneWidth,
      height: y + 12,
      laneCount,
      nodes,
      groups,
      together,
      lines,
    };
  }

  /**
   * Down its lane; it only bends shortly before or after a scene it shares with other threads
   * (like the desktop view, turned).
   */
  function linePath(points: Array<{ x: number; y: number }>, laneX: number): string {
    const curve = (x1: number, y1: number, x2: number, y2: number) => {
      const middle = (y1 + y2) / 2;
      return `C${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`;
    };
    const [first, ...rest] = points;
    const parts = [`M${first!.x} ${first!.y}`];
    let a = first!;
    for (const b of rest) {
      if (a.x === laneX && b.x === laneX) {
        parts.push(`V${b.y}`);
      } else if (b.y - a.y <= 2 * BEND) {
        parts.push(curve(a.x, a.y, b.x, b.y));
      } else {
        if (a.x !== laneX) parts.push(curve(a.x, a.y, laneX, a.y + BEND));
        parts.push(`V${b.y - (b.x === laneX ? 0 : BEND)}`);
        if (b.x !== laneX) parts.push(curve(laneX, b.y - BEND, b.x, b.y));
      }
      a = b;
    }
    return parts.join(' ');
  }

  function renderPlot(): Node[] {
    const turningPoints = entries.filter((entry) => entry.scene.turningPoint).length;
    const onlyTurningPoints = !!state.plotOnlyTurningPoints && turningPoints > 0;
    const lanes = strands.length + 1; // room for "no thread", which most books have
    const style = getComputedStyle(main);
    const available =
      main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    laneWidth = Math.max(44, Math.min(80, Math.floor(available / lanes)));
    const layout = plotLayout(onlyTurningPoints);
    const nodes: Node[] = [h('h1', {}, T.plot)];
    if (turningPoints > 0) {
      const choice = (only: boolean, label: string) =>
        h(
          'button',
          {
            type: 'button',
            'aria-pressed': String(onlyTurningPoints === only),
            onclick: () => {
              state.plotOnlyTurningPoints = only;
              save();
              render();
            },
          },
          label,
        );
      nodes.push(
        h(
          'div',
          { class: 'plot-filter' },
          choice(false, T.allScenes),
          choice(true, T.turningPoints(turningPoints)),
        ),
      );
    }
    nodes.push(h('p', { class: 'muted plot-hint' }, T.plotHint));

    const names = h('div', { class: 'plot-lanes', style: `width: ${layout.width}px` });
    strands.forEach((strand) =>
      names.append(
        h(
          'span',
          { class: 'plot-lane', title: strand.name, style: `width: ${laneWidth}px` },
          h('span', { class: 'dot', style: `background: var(--strand-${strand.color})` }),
          strand.name,
        ),
      ),
    );
    if (layout.laneCount > strands.length) {
      names.append(
        h('span', { class: 'plot-lane unassigned', style: `width: ${laneWidth}px` }, T.noStrand),
      );
    }

    const drawing = svg('svg', {
      class: 'plot-drawing',
      width: layout.width,
      height: layout.height,
      viewBox: `0 0 ${layout.width} ${layout.height}`,
    });
    for (const box of layout.together) {
      drawing.append(
        svg('rect', {
          class: 'plot-together',
          x: 2,
          y: box.top + 2,
          width: layout.width - 4,
          height: box.bottom - box.top - 4,
          rx: 8,
        }),
      );
    }
    for (let index = 0; index < layout.laneCount; index++) {
      const x = index * laneWidth + laneWidth / 2;
      drawing.append(svg('line', { class: 'plot-guide', x1: x, x2: x, y1: 0, y2: layout.height }));
    }
    for (const group of layout.groups) {
      drawing.append(
        svg('line', {
          class: 'plot-group-line',
          x1: 0,
          x2: layout.width,
          y1: group.y + 4,
          y2: group.y + 4,
        }),
        svg(
          'text',
          { class: 'plot-group', x: 2, y: group.y },
          document.createTextNode(group.label),
        ),
      );
    }
    for (const line of layout.lines) {
      drawing.append(
        svg('path', {
          class: 'plot-line',
          d: line.path,
          style: `stroke: var(--strand-${line.strand.color})`,
        }),
      );
    }
    for (const node of layout.nodes) {
      const { scene } = node.entry;
      const diamond = scene.turningPoint && node.width === NODE;
      const r = NODE * 0.68;
      const shape = diamond
        ? svg('polygon', {
            points: `${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`,
          })
        : svg('rect', {
            x: node.x - node.width / 2,
            y: node.y - NODE / 2,
            width: node.width,
            height: NODE,
            rx: NODE / 2,
          });
      const number = svg(
        'text',
        { class: 'plot-number', x: node.x, y: node.y },
        document.createTextNode(String(node.entry.number)),
      );
      const g = svg(
        'g',
        {
          class: scene.turningPoint ? 'plot-node turning' : 'plot-node',
          role: 'button',
          tabindex: 0,
          'data-scene': scene.id,
          'aria-label': scene.title,
        },
        shape,
        number,
      );
      g.addEventListener('click', () => openSceneInfo(node.entry));
      drawing.append(g);
    }
    nodes.push(h('div', { class: 'plot' }, names, drawing));
    return nodes;
  }

  function openSceneInfo(entry: PlotEntry): void {
    const chapter = pkg.chapters[entry.chapterIndex]!;
    const close = () => {
      sheet.hidden = true;
      sheet.replaceChildren();
    };
    const sceneStrands = strands.filter((strand) => entry.scene.strandIds?.includes(strand.id));
    sheet.replaceChildren(
      h(
        'div',
        { class: 'sheet plot-info', role: 'dialog', 'aria-label': entry.scene.title },
        h('p', { class: 'kicker' }, `${T.chapter(chapter.number)} · ${chapter.title}`),
        h('h2', {}, entry.scene.title),
        h(
          'p',
          { class: 'plot-meta' },
          ...sceneStrands.map((strand) =>
            h(
              'span',
              { class: 'plot-strand' },
              h('span', { class: 'dot', style: `background: var(--strand-${strand.color})` }),
              strand.name,
            ),
          ),
          sceneStrands.length ? null : h('span', { class: 'muted' }, T.noStrand),
          entry.scene.turningPoint
            ? h('span', { class: 'plot-strand' }, `◆ ${T.turningPoint}`)
            : null,
          h('span', { class: 'muted' }, T.bookPosition(entry.number)),
        ),
        h(
          'div',
          { class: 'sheet-buttons' },
          h('span'),
          h('button', { type: 'button', onclick: close }, T.close),
          h(
            'button',
            {
              type: 'button',
              class: 'primary',
              onclick: () => {
                close();
                jumpToScene(entry);
              },
            },
            T.toText,
          ),
        ),
      ),
    );
    sheet.hidden = false;
  }

  function jumpToScene(entry: PlotEntry): void {
    go({ name: 'chapter', chapter: entry.chapterIndex });
    main
      .querySelector<HTMLElement>(`article[data-scene="${entry.scene.id}"]`)
      ?.scrollIntoView({ block: 'start' });
  }

  /** Notes never overlap. */
  function fillParagraph(
    element: HTMLElement,
    text: string,
    sceneId: string,
    paragraph: number,
  ): void {
    const notes = state.notes
      .filter((note) => note.sceneId === sceneId && note.paragraph === paragraph)
      .sort((a, b) => a.start - b.start);
    let offset = 0;
    for (const note of notes) {
      if (note.start > offset) element.append(text.slice(offset, note.start));
      element.append(
        h(
          'mark',
          {
            class: note.suggestion !== null ? 'note suggestion' : 'note',
            'data-note': note.id,
            onclick: (event: Event) => {
              event.stopPropagation();
              openSheet({ note });
            },
          },
          text.slice(note.start, note.end),
        ),
      );
      offset = note.end;
    }
    if (offset < text.length) element.append(text.slice(offset));
  }

  function renderNotes(): Node[] {
    if (!state.notes.length) return [h('h1', {}, T.notes), h('p', { class: 'muted' }, T.noNotes)];
    const nodes: Node[] = [h('h1', {}, T.notes), sendSection()];
    pkg.chapters.forEach((chapter, index) => {
      const notes = notesIn(index);
      if (!notes.length) return;
      const order = new Map(chapter.scenes.map((scene, i) => [scene.id, i]));
      notes.sort(
        (a, b) =>
          order.get(a.sceneId)! - order.get(b.sceneId)! ||
          a.paragraph - b.paragraph ||
          a.start - b.start,
      );
      nodes.push(h('h2', {}, `${chapter.number} · ${chapter.title}`));
      const list = h('ul', { class: 'note-list' });
      for (const note of notes) {
        list.append(
          h(
            'li',
            {},
            h(
              'button',
              { type: 'button', onclick: () => jumpTo(index, note) },
              h(
                'span',
                { class: 'quote' },
                note.suggestion !== null
                  ? T.replaceShort(note.quote, note.suggestion)
                  : T.quoteOf(note.quote),
              ),
              note.note ? h('span', { class: 'text' }, note.note) : null,
            ),
          ),
        );
      }
      nodes.push(list);
    });
    return nodes;
  }

  function jumpTo(chapter: number, note: LocalNote): void {
    go({ name: 'chapter', chapter });
    const mark = main.querySelector<HTMLElement>(`mark[data-note="${note.id}"]`);
    mark?.scrollIntoView({ block: 'center' });
    mark?.classList.add('flash');
  }

  function paragraphOf(node: Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node?.parentElement;
    return element?.closest<HTMLElement>('p.para') ?? null;
  }

  /** Character offset in the plain paragraph text (highlights count with their text). */
  function offsetIn(paragraph: HTMLElement, node: Node, offset: number): number {
    const range = document.createRange();
    range.setStart(paragraph, 0);
    range.setEnd(node, offset);
    return range.toString().length;
  }

  let selectionTimer: ReturnType<typeof setTimeout> | undefined;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selectionTimer);
    selectionTimer = setTimeout(readSelection, 150);
  });

  function readSelection(): void {
    if (view.name !== 'chapter' || !sheet.hidden) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.anchorNode || !selection.focusNode) {
      hideActions();
      return;
    }
    const paragraph = paragraphOf(selection.anchorNode);
    if (!paragraph || paragraph !== paragraphOf(selection.focusNode)) {
      showActions(null, T.oneParagraph);
      return;
    }
    const text = paragraph.textContent ?? '';
    let start = offsetIn(paragraph, selection.anchorNode, selection.anchorOffset);
    let end = offsetIn(paragraph, selection.focusNode, selection.focusOffset);
    if (start > end) [start, end] = [end, start];
    // Whitespace at the edges of the selection does not belong to it
    while (start < end && /\s/.test(text[start]!)) start++;
    while (end > start && /\s/.test(text[end - 1]!)) end--;
    if (start === end) {
      hideActions();
      return;
    }
    const sceneId = paragraph.dataset['scene']!;
    const index = Number(paragraph.dataset['paragraph']);
    const overlapping = state.notes.some(
      (note) =>
        note.sceneId === sceneId &&
        note.paragraph === index &&
        note.start < end &&
        start < note.end,
    );
    if (overlapping) {
      showActions(null, T.overlaps);
      return;
    }
    showActions({ sceneId, paragraph: index, start, end, quote: text.slice(start, end) });
  }

  function showActions(selection: Selected | null, hint?: string): void {
    selected = selection;
    actions.replaceChildren(
      ...(selection
        ? [
            h('button', { type: 'button', onclick: () => startNote(false) }, T.note),
            h('button', { type: 'button', onclick: () => startNote(true) }, T.suggestion),
          ]
        : [h('span', { class: 'hint' }, hint ?? '')]),
    );
    actions.hidden = false;
  }

  function hideActions(): void {
    selected = null;
    actions.hidden = true;
  }

  function startNote(suggest: boolean): void {
    const selection = selected;
    if (!selection) return;
    window.getSelection()?.removeAllRanges();
    hideActions();
    openSheet({ selection, suggest });
  }

  function openSheet(input: { note: LocalNote } | { selection: Selected; suggest: boolean }): void {
    const existing = 'note' in input ? input.note : null;
    const quote = existing ? existing.quote : (input as { selection: Selected }).selection.quote;
    const suggest = existing
      ? existing.suggestion !== null
      : (input as { suggest: boolean }).suggest;

    const replacement = h('textarea', { rows: 2, class: 'replacement' }) as HTMLTextAreaElement;
    replacement.value = existing?.suggestion ?? quote;
    const noteField = h('textarea', { rows: suggest ? 2 : 4 }) as HTMLTextAreaElement;
    noteField.value = existing?.note ?? '';
    const error = h('p', { class: 'error', hidden: true });

    const close = () => {
      sheet.hidden = true;
      sheet.replaceChildren();
    };
    const submit = () => {
      const noteText = noteField.value.trim();
      const suggestion = suggest ? replacement.value : null;
      // A suggestion must change the text – otherwise "Accept" on the computer would do nothing
      const problem =
        suggestion === quote ? T.unchanged : suggestion === null && !noteText ? T.emptyNote : null;
      if (problem) {
        error.textContent = problem;
        error.hidden = false;
        return;
      }
      if (existing) {
        existing.note = noteText;
        existing.suggestion = suggestion;
      } else {
        const { selection } = input as { selection: Selected };
        const scene = pkg.chapters
          .flatMap((chapter) => chapter.scenes)
          .find((s) => s.id === selection.sceneId);
        const text = scene?.paragraphs[selection.paragraph] ?? '';
        state.notes.push({
          id: newId(),
          sceneId: selection.sceneId,
          paragraph: selection.paragraph,
          quote: selection.quote,
          prefix: text.slice(Math.max(0, selection.start - CONTEXT), selection.start),
          suffix: text.slice(selection.end, selection.end + CONTEXT),
          note: noteText,
          suggestion,
          createdAt: new Date().toISOString(),
          start: selection.start,
          end: selection.end,
        });
      }
      saveNow();
      close();
      rerenderKeepingScroll();
    };
    const remove = () => {
      state.notes = state.notes.filter((note) => note !== existing);
      saveNow();
      close();
      rerenderKeepingScroll();
    };

    sheet.replaceChildren(
      h(
        'form',
        {
          class: 'sheet',
          onsubmit: (event: Event) => {
            event.preventDefault();
            submit();
          },
        },
        h('p', { class: 'sheet-quote' }, T.quoteOf(quote)),
        suggest
          ? h('label', {}, h('span', {}, `${T.replaceWith} (${T.deleteSuggestion})`), replacement)
          : null,
        h('label', {}, h('span', {}, suggest ? T.reason : T.noteText), noteField),
        error,
        h(
          'div',
          { class: 'sheet-buttons' },
          existing
            ? h('button', { type: 'button', class: 'danger', onclick: remove }, T.delete)
            : h('span'),
          h('button', { type: 'button', onclick: close }, T.cancel),
          h('button', { type: 'submit', class: 'primary' }, T.save),
        ),
      ),
    );
    sheet.hidden = false;
    // The prefilled replacement is selected: typing replaces it instead of appending
    if (suggest) {
      replacement.focus();
      replacement.select();
    } else {
      noteField.focus();
    }
  }

  sheet.addEventListener('click', (event) => {
    if (event.target === sheet) {
      sheet.hidden = true;
      sheet.replaceChildren();
    }
  });

  function rerenderKeepingScroll(): void {
    const scroll = window.scrollY;
    render();
    window.scrollTo(0, scroll);
  }

  // Sent as .txt via Share (Chrome does not share .json), otherwise downloaded

  async function sendNotes(): Promise<void> {
    const file: ProofNotesFile = {
      format: 'wortomat-proof-notes',
      version: 1,
      packageId: pkg.id,
      title: pkg.title,
      exportedAt: new Date().toISOString(),
      notes: state.notes.map(({ start: _start, end: _end, ...note }) => note),
    };
    const name = `${pkg.title.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Wortomat'}.notizen.txt`;
    const blob = new File([JSON.stringify(file, null, 1)], name, { type: 'text/plain' });
    const markSent = () => {
      state.sentAt = new Date().toISOString();
      state.sentCount = state.notes.length;
      saveNow();
      render();
    };
    if (navigator.canShare?.({ files: [blob] })) {
      try {
        await navigator.share({ files: [blob], title: name });
        markSent();
        showToast(T.sent);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return; // cancelled
      }
    }
    const url = URL.createObjectURL(blob);
    const link = h('a', { href: url, download: name });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    markSent();
    showToast(T.downloaded);
  }

  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('scroll', () => {
    if (view.name !== 'chapter') return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      state.scroll = window.scrollY;
      save();
    }, 400);
  });
  // Save right away when leaving (app switch, screen off)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow();
  });

  history.replaceState(view, '');
  void (async () => {
    try {
      db = await openDb();
      const stored = await loadState();
      if (stored) state = { ...state, ...stored };
    } catch {
      storageOk = false;
    }
    render();
  })();
  render();
}
