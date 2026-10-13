/// <reference lib="dom" />
import type { ProofNote, ProofNotesFile, ProofPackage } from '@wortomat/shared';

/**
 * Die Lese-App der Korrekturfassung. Läuft auf dem Handy, offline, in einer einzelnen
 * HTML-Datei: `readerHtml()` bettet den Quelltext dieser Funktion als Skript ein.
 *
 * Deshalb muss alles hier drin stehen – keine Importe (außer Typen), keine Hilfsfunktionen
 * von außerhalb. Die Daten liest sie aus `<script id="proof-data">`.
 */
export function readerApp(): void {
  /** Notiz mit Position im Absatz – die Position braucht nur das Handy (Hervorhebung). */
  interface LocalNote extends ProofNote {
    start: number;
    end: number;
  }

  type View = { name: 'home' } | { name: 'chapter'; chapter: number } | { name: 'notes' };

  interface State {
    notes: LocalNote[];
    /** Zuletzt gelesenes Kapitel (Index) und Scrollposition darin. */
    chapter: number | null;
    scroll: number;
    /** Wann zuletzt gesendet – und wie viele Notizen es da waren. */
    sentAt: string | null;
    sentCount: number;
    fontScale: number;
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
      };

  const dateFormat = new Intl.DateTimeFormat(german ? 'de' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const formatDate = (iso: string) => dateFormat.format(new Date(iso));

  // -------------------------------------------------------------------------
  // Kleine DOM-Helfer
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Zustand: in IndexedDB je Korrekturfassung (localStorage hält auf Android nicht immer)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Aufbau der Seite
  // -------------------------------------------------------------------------

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

  /** Neue Ansicht mit Eintrag im Verlauf – so führt die Zurück-Geste von Android zurück. */
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
    main.replaceChildren(
      ...(storageOk ? [] : [h('p', { class: 'warning' }, T.storageFailed)]),
      ...(view.name === 'home'
        ? renderHome()
        : view.name === 'notes'
          ? renderNotes()
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
        { class: 'scene' },
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

  /** Absatztext mit hervorgehobenen Notizen (sie überlappen nie). */
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

  // -------------------------------------------------------------------------
  // Markieren: Auswahl innerhalb eines Absatzes → „Notiz“ / „Vorschlag“
  // -------------------------------------------------------------------------

  function paragraphOf(node: Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node?.parentElement;
    return element?.closest<HTMLElement>('p.para') ?? null;
  }

  /** Zeichenposition im reinen Absatztext (Hervorhebungen zählen mit ihrem Text). */
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
    // Leerraum am Rand der Auswahl gehört nicht dazu
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

  // -------------------------------------------------------------------------
  // Notiz bearbeiten (Blatt von unten)
  // -------------------------------------------------------------------------

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
      // Ein Vorschlag muss den Text ändern – sonst hieße „Übernehmen“ am Rechner: nichts tun
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
    // Der vorausgefüllte Ersatztext ist markiert: Tippen ersetzt ihn, statt ihn zu ergänzen
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

  // -------------------------------------------------------------------------
  // Senden: als .txt über „Teilen“ (Chrome teilt kein .json), sonst herunterladen
  // -------------------------------------------------------------------------

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
        if ((error as Error).name === 'AbortError') return; // abgebrochen
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

  // -------------------------------------------------------------------------
  // Start
  // -------------------------------------------------------------------------

  let scrollTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener('scroll', () => {
    if (view.name !== 'chapter') return;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      state.scroll = window.scrollY;
      save();
    }, 400);
  });
  // Beim Wegwechseln (App-Wechsel, Bildschirm aus) sofort sichern
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
