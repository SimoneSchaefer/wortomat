import { TestBed } from '@angular/core/testing';
import type { EditorDoc, SaveDocumentRequest } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { StatusMessages } from '../../core/status-messages';
import { button, findButton, key, render, text, type, until } from '../../testing/render';
import { DocumentEditor, type DocumentSource, normalizeHref } from './document-editor';

const mark = (kind: string, attrs: { note?: string; suggestion?: string } = {}) => [
  {
    type: 'annotation',
    attrs: { kind, note: attrs.note ?? null, suggestion: attrs.suggestion ?? null },
  },
];

// "Am Abend kam der alte Mann." – a plain todo, a fixme with a suggestion, an idea with a note
const SCENE: EditorDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Am Abend', marks: mark('todo') },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'kam', marks: mark('fixme', { suggestion: 'schlich' }) },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'der alte Mann', marks: mark('idea', { note: 'Name klären' }) },
        { type: 'text', text: '.' },
      ],
    },
  ],
} as EditorDoc;

function fakeSource(docs: Record<string, EditorDoc | null> = { s1: SCENE }) {
  return {
    load: vi.fn(async (id: string) => ({ doc: structuredClone(docs[id] ?? null), wordCount: 6 })),
    save: vi.fn(async (_id: string, _request: SaveDocumentRequest) => undefined),
  } satisfies DocumentSource;
}

async function setup(source = fakeSource(), inputs: Record<string, unknown> = {}) {
  const view = await render(DocumentEditor, {
    inputs: { documentId: 's1', source, ...inputs },
  });
  const prose = () => view.element.querySelector<HTMLElement>('.ProseMirror');
  const status = () => text(view.element.querySelector('.statusbar .status'));
  // The editor mounts itself into the DOM; wait for Angular to show the loaded state too.
  await until(view.settle, () => !!prose() && status() === de.editor.saveStatus.saved);
  const items = () => [...view.element.querySelectorAll<HTMLElement>('.mark-item')];
  /** [kind, quote, note or suggestion] per list entry. */
  const listed = () =>
    items().map((item) =>
      ['.mark-item-kind', '.mark-item-quote', '.mark-item-suggestion, .mark-item-note'].map(
        (selector) => text(item.querySelector(selector)),
      ),
    );
  const bar = () => view.element.querySelector<HTMLElement>('.mark-note');
  const jumpTo = async (quote: string) => {
    items()
      .find((item) => text(item).includes(de.editor.quote(quote)))!
      .click();
    await view.settle();
  };
  /** What would reach the backend if the app closed now. */
  const saved = async () => {
    await TestBed.inject(PendingSaves).flushAll();
    return source.save.mock.calls.at(-1)?.[1];
  };
  /** Opens a toolbar dropdown and chooses an entry (its name without the shortcut). */
  const choose = async (menu: string, entry: string) => {
    button(view.element, menu).click();
    await view.settle();
    button(view.element, new RegExp(`^${entry}( |$)`)).click();
    await view.settle();
  };
  return { ...view, source, prose, items, listed, bar, jumpTo, saved, choose };
}

const PLAIN: EditorDoc = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Es war einmal.' }] }],
} as EditorDoc;

describe('DocumentEditor', () => {
  it('loads the document and shows word count and save status', async () => {
    const { source, prose, element } = await setup();
    expect(source.load).toHaveBeenCalledWith('s1');
    expect(text(prose())).toBe('Am Abend kam der alte Mann.');
    expect(text(element.querySelector('.statusbar'))).toContain(de.words(6));
    expect(text(element.querySelector('.statusbar .status'))).toBe(de.editor.saveStatus.saved);
  });

  it('lists all marks in text order, with note or suggestion', async () => {
    const { element, items, listed, settle } = await setup();
    const toggle = button(element, new RegExp(de.editor.markCount(3)));
    expect(listed()).toEqual([
      ['Todo', '„Am Abend“', ''],
      ['Fixme', '„kam“', de.editor.proofReplace('kam', 'schlich')],
      ['Idee', '„der alte Mann“', 'Name klären'],
    ]);

    toggle.click();
    await settle();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(items()).toEqual([]);
  });

  it('jumps from the list to the passage and shows its note there', async () => {
    const { bar, jumpTo, items } = await setup();
    // After loading, the cursor sits at the start of the text – inside the todo.
    expect(text(bar()?.querySelector('.mark-label'))).toBe('Todo');

    await jumpTo('der alte Mann');
    expect(text(bar()?.querySelector('.mark-label'))).toBe('Idee');
    expect(text(bar()?.querySelector('.mark-text'))).toBe('Name klären');
    expect(items()[2]!.classList).toContain('current');
  });

  it('adds a note to a mark without one', async () => {
    const { bar, jumpTo, listed, settle, saved } = await setup();
    await jumpTo('Am Abend');
    expect(text(bar()?.querySelector('.mark-empty'))).toBe(de.editor.noNote);

    button(bar()!, de.editor.addNote).click();
    await settle();
    const input = bar()!.querySelector<HTMLInputElement>('input')!;
    expect(document.activeElement).toBe(input);

    input.value = 'Wetter prüfen';
    key(input, 'Enter');
    await settle();
    expect(listed()[0]).toEqual(['Todo', '„Am Abend“', 'Wetter prüfen']);
    expect(findButton(bar()!, de.editor.editNote)).not.toBeNull();
    expect(JSON.stringify((await saved())?.doc)).toContain('"note":"Wetter prüfen"');
  });

  it('discards a started note with Escape', async () => {
    const { bar, jumpTo, settle, source } = await setup();
    await jumpTo('der alte Mann');
    button(bar()!, de.editor.editNote).click();
    await settle();
    const input = bar()!.querySelector<HTMLInputElement>('input')!;
    expect(input.value).toBe('Name klären');

    input.value = 'Anders';
    key(input, 'Escape');
    await settle();
    expect(text(bar()?.querySelector('.mark-text'))).toBe('Name klären');
    await TestBed.inject(PendingSaves).flushAll();
    expect(source.save).not.toHaveBeenCalled();
  });

  it('removes a note when the field is emptied – the mark stays', async () => {
    const { bar, jumpTo, listed, settle } = await setup();
    await jumpTo('der alte Mann');
    button(bar()!, de.editor.editNote).click();
    await settle();
    const input = bar()!.querySelector<HTMLInputElement>('input')!;
    input.value = '  ';
    key(input, 'Enter');
    await settle();
    expect(listed()[2]).toEqual(['Idee', '„der alte Mann“', '']);
  });

  it('accepts a suggestion: text replaced, mark gone', async () => {
    const { bar, jumpTo, prose, items, settle, saved } = await setup();
    await jumpTo('kam');
    button(bar()!, de.editor.proofAccept).click();
    await settle();
    expect(text(prose())).toBe('Am Abend schlich der alte Mann.');
    expect(items()).toHaveLength(2);
    expect((await saved())?.text).toBe('Am Abend schlich der alte Mann.');
  });

  it('completes a mark with "Done", the text stays', async () => {
    const { bar, jumpTo, prose, items, settle } = await setup();
    await jumpTo('Am Abend');
    button(bar()!, de.editor.proofDone).click();
    await settle();
    expect(text(prose())).toBe('Am Abend kam der alte Mann.');
    expect(items().map((item) => text(item.querySelector('.mark-item-quote')))).toEqual([
      '„kam“',
      '„der alte Mann“',
    ]);
  });

  it('saves unsaved changes before another document is loaded', async () => {
    const source = fakeSource({ s1: SCENE, s2: null });
    const { fixture, bar, jumpTo, settle, prose } = await setup(source);
    await jumpTo('Am Abend');
    button(bar()!, de.editor.proofDone).click();
    await settle();

    fixture.componentRef.setInput('documentId', 's2');
    await until(settle, () => source.load.mock.calls.length === 2);
    await until(settle, () => text(prose()) === '');
    expect(source.save.mock.calls.map(([id]) => id)).toEqual(['s1']);
  });

  it('starts a never saved document with the template', async () => {
    const template = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Aussehen' }] },
      ],
    } as EditorDoc;
    const { prose } = await setup(fakeSource({ s1: null }), { template });
    expect(prose()!.querySelector('h2')?.textContent).toBe('Aussehen');
  });

  it('reports when the document cannot be loaded', async () => {
    const source = fakeSource();
    source.load.mockRejectedValueOnce(new Error('Datei gesperrt'));
    const view = await render(DocumentEditor, { inputs: { documentId: 's1', source } });
    await until(
      view.settle,
      () => text(view.element.querySelector('.statusbar .status')) === de.editor.saveStatus.error,
    );
    expect(TestBed.inject(StatusMessages).messages()[0]!.text).toBe('Datei gesperrt');
  });

  it('sets paragraph style, alignment and indentation from the grouped menus', async () => {
    const { choose, saved } = await setup(fakeSource({ s1: PLAIN }));
    const E = de.editor;
    await choose(E.blockStyle, E.heading);
    await choose(E.alignment, E.alignCenter);
    await choose(E.alignment, E.indent);
    await choose(E.alignment, E.indent);
    expect((await saved())?.doc.content?.[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 2, textAlign: 'center', indent: 2 },
    });

    await choose(E.alignment, E.outdent);
    await choose(E.blockStyle, E.blockquote);
    expect((await saved())?.doc.content?.[0]).toMatchObject({
      type: 'blockquote',
      content: [{ type: 'heading', attrs: { indent: 1 } }],
    });

    await choose(E.textStyle, E.clearFormat);
    expect((await saved())?.doc.content?.[0]).toMatchObject({
      type: 'paragraph',
      attrs: { textAlign: null, indent: 0 },
    });
  });

  it('turns a paragraph into a list and back', async () => {
    const { choose, saved, element } = await setup(fakeSource({ s1: PLAIN }));
    await choose(de.editor.lists, de.editor.bulletList);
    expect((await saved())?.doc.content?.[0]).toMatchObject({ type: 'bulletList' });
    expect(button(element, de.editor.lists).classList).toContain('on');

    await choose(de.editor.lists, de.editor.orderedList);
    expect((await saved())?.doc.content?.[0]).toMatchObject({ type: 'orderedList' });
    await choose(de.editor.lists, de.editor.orderedList);
    expect((await saved())?.doc.content?.[0]).toMatchObject({ type: 'paragraph' });
  });

  it('inserts a link – the address becomes the text when nothing is selected', async () => {
    const { element, saved, settle } = await setup(fakeSource({ s1: PLAIN }));
    button(element, de.editor.link).click();
    await settle();
    const input = element.querySelector<HTMLInputElement>('.link-form input')!;
    expect(document.activeElement).toBe(input);
    type(input, 'example.com');
    input.form!.requestSubmit();
    await settle();

    expect(element.querySelector('.link-form')).toBeNull();
    expect(JSON.stringify((await saved())?.doc)).toContain(
      '{"type":"text","marks":[{"type":"link","attrs":{"href":"https://example.com"',
    );
  });

  it('completes link addresses', () => {
    expect(normalizeHref(' example.com/a ')).toBe('https://example.com/a');
    expect(normalizeHref('anna@example.com')).toBe('mailto:anna@example.com');
    expect(normalizeHref('http://example.com')).toBe('http://example.com');
    expect(normalizeHref('  ')).toBe('');
  });
});
