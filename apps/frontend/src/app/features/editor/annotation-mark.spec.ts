import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { de } from '../../core/i18n/de';
import { Annotation, annotationAt, annotationsIn } from './annotation-mark';

/** Real Tiptap editor (jsdom) with the sentence "Hier fehlt noch was." */
function createEditor(): Editor {
  return new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, Annotation.configure({ label: (kind) => de.annotations[kind].label })],
    content: '<p>Hier fehlt noch was.</p>',
  });
}

interface TextJson {
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

/** [text, mark kind] per text node of the first paragraph. */
const marksOf = (editor: Editor) =>
  ((editor.getJSON().content?.[0]?.content ?? []) as TextJson[]).map((node) => [
    node.text,
    node.marks?.find((mark) => mark.type === 'annotation')?.attrs?.['kind'] ?? null,
  ]);

describe('Annotation (todo/idea/fixme)', () => {
  it('marks the selection and renders a <mark> with its kind', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('todo').run();
    expect(marksOf(editor)).toEqual([
      ['Hier ', null],
      ['fehlt', 'todo'],
      [' noch was.', null],
    ]);
    expect(editor.getHTML()).toContain(
      '<mark class="wm-annotation" data-annotation="todo" title="Todo">fehlt</mark>',
    );
    editor.destroy();
  });

  // Ctrl+Alt+T would open a terminal on Ubuntu before the editor sees it
  it.each([
    ['o', 'todo'],
    ['i', 'idea'],
    ['f', 'fixme'],
  ])('marks the selection on Ctrl+Alt+%s as %s', (key, kind) => {
    const editor = createEditor();
    editor.commands.setTextSelection({ from: 6, to: 11 });
    const event = new KeyboardEvent('keydown', {
      key,
      keyCode: key.toUpperCase().charCodeAt(0),
      ctrlKey: true,
      altKey: true,
    });
    editor.view.someProp('handleKeyDown', (handle) => handle(editor.view, event));
    expect(marksOf(editor)[1]).toEqual(['fehlt', kind]);
    editor.destroy();
  });

  it('removes the whole mark when the cursor is inside it', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('idea').run();
    editor.chain().setTextSelection(8).toggleAnnotation('idea').run();
    expect(marksOf(editor)).toEqual([['Hier fehlt noch was.', null]]);
    editor.destroy();
  });

  it('replaces another kind instead of stacking', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('todo').run();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('fixme').run();
    expect(marksOf(editor)).toEqual([
      ['Hier ', null],
      ['fehlt', 'fixme'],
      [' noch was.', null],
    ]);
    editor.destroy();
  });

  it('without a selection: toggles "keep typing like this" on and off again (keystroke by keystroke)', () => {
    const editor = createEditor();
    const typeKeys = (text: string) => {
      for (const char of text) editor.view.dispatch(editor.state.tr.insertText(char));
    };
    editor.commands.setTextSelection(21); // end of the paragraph
    typeKeys(' ');
    editor.commands.toggleAnnotation('todo');
    typeKeys('Namen?');
    editor.commands.toggleAnnotation('todo'); // right after the mark: switch off
    typeKeys(' Weiter.');
    expect(marksOf(editor)).toEqual([
      ['Hier fehlt noch was. ', null],
      ['Namen?', 'todo'],
      [' Weiter.', null],
    ]);
    editor.destroy();
  });

  it('with a selection removes only if it is fully marked – otherwise marks', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('todo').run();
    editor.chain().setTextSelection({ from: 1, to: 11 }).toggleAnnotation('todo').run();
    expect(marksOf(editor)).toEqual([
      ['Hier fehlt', 'todo'],
      [' noch was.', null],
    ]);
    editor.chain().setTextSelection({ from: 1, to: 11 }).toggleAnnotation('todo').run();
    expect(marksOf(editor)).toEqual([['Hier fehlt noch was.', null]]);
    editor.destroy();
  });

  it('reads marks from HTML (e.g. when pasting from the clipboard)', () => {
    const editor = createEditor();
    editor.commands.setContent('<p><mark data-annotation="idea">Möwe?</mark></p>');
    expect(marksOf(editor)).toEqual([['Möwe?', 'idea']]);
    editor.destroy();
  });
});

describe('proofreading notes (from proofreading on the go)', () => {
  /** "Hier fehlt noch was." with "fehlt" italic and marked as fixme with a suggestion. */
  function editorWithNote(attrs: { note: string | null; suggestion: string | null }): Editor {
    return new Editor({
      element: document.createElement('div'),
      extensions: [
        StarterKit,
        Annotation.configure({ label: (kind) => de.annotations[kind].label }),
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hier ' },
              {
                type: 'text',
                text: 'fehlt',
                marks: [
                  { type: 'italic' },
                  { type: 'annotation', attrs: { kind: 'fixme', ...attrs } },
                ],
              },
              { type: 'text', text: ' noch was.' },
            ],
          },
        ],
      },
    });
  }

  it('finds the note at the cursor – also right at its start – and shows it in the tooltip', () => {
    const editor = editorWithNote({ note: 'Was fehlt?', suggestion: 'mangelt' });
    for (const position of [6, 8]) {
      editor.commands.setTextSelection(position);
      expect(annotationAt(editor.state)).toEqual({
        kind: 'fixme',
        note: 'Was fehlt?',
        suggestion: 'mangelt',
        text: 'fehlt',
        from: 6,
        to: 11,
      });
    }
    editor.commands.setTextSelection(2);
    expect(annotationAt(editor.state)).toBeNull();
    expect(editor.getHTML()).toContain('title="Fixme: Was fehlt?"');
    expect(editor.getHTML()).toContain('data-suggestion="mangelt"');
    editor.destroy();
  });

  it('accepts a suggestion: text replaced, italic stays, mark gone', () => {
    const editor = editorWithNote({ note: null, suggestion: 'mangelt' });
    editor.chain().setTextSelection(8).resolveAnnotation(true).run();
    expect(editor.getText()).toBe('Hier mangelt noch was.');
    expect(editor.getHTML()).toBe('<p>Hier <em>mangelt</em> noch was.</p>');
    editor.destroy();
  });

  it('rejects a suggestion or completes a note: only the mark goes', () => {
    const editor = editorWithNote({ note: 'Was fehlt?', suggestion: null });
    editor.chain().setTextSelection(8).resolveAnnotation(true).run();
    expect(editor.getHTML()).toBe('<p>Hier <em>fehlt</em> noch was.</p>');
    editor.destroy();
  });

  it('treats a suggestion that changes nothing as a note – nothing to accept', () => {
    const editor = editorWithNote({ note: 'Grün', suggestion: 'fehlt' });
    editor.commands.setTextSelection(8);
    expect(annotationAt(editor.state)).toMatchObject({ note: 'Grün', suggestion: null });
    editor.chain().resolveAnnotation(true).run();
    expect(editor.getHTML()).toBe('<p>Hier <em>fehlt</em> noch was.</p>');
    editor.destroy();
  });

  it('adds, changes and removes a note – kind, suggestion and italic stay', () => {
    const editor = editorWithNote({ note: null, suggestion: 'mangelt' });
    editor.chain().setTextSelection(8).setAnnotationNote('  Lieber kürzer? ').run();
    expect(annotationAt(editor.state)).toMatchObject({
      kind: 'fixme',
      note: 'Lieber kürzer?',
      suggestion: 'mangelt',
      from: 6,
      to: 11,
    });
    expect(editor.getHTML()).toContain('<em>');
    editor.chain().setAnnotationNote('').run();
    expect(annotationAt(editor.state)).toMatchObject({ note: null, suggestion: 'mangelt' });
    editor.destroy();
  });

  it('also finds marks without a note at the cursor', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('idea').run();
    editor.commands.setTextSelection(8);
    expect(annotationAt(editor.state)).toMatchObject({ kind: 'idea', note: null, text: 'fehlt' });
    expect(editor.commands.setAnnotationNote('Ausbauen')).toBe(true);
    expect(editor.getHTML()).toContain('data-note="Ausbauen"');
    editor.destroy();
  });

  it('lists all marks in text order – one stays one, even with bold inside', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      extensions: [StarterKit, Annotation],
      content:
        '<p><mark data-annotation="todo" data-note="A">eins <strong>zwei</strong></mark> drei</p>' +
        '<p>vier <mark data-annotation="fixme">fünf</mark></p>',
    });
    expect(
      annotationsIn(editor.state.doc).map(({ kind, note, text }) => ({ kind, note, text })),
    ).toEqual([
      { kind: 'todo', note: 'A', text: 'eins zwei' },
      { kind: 'fixme', note: null, text: 'fünf' },
    ]);
    editor.destroy();
  });

  it('deletes the text for an empty suggestion', () => {
    const editor = editorWithNote({ note: null, suggestion: '' });
    editor.chain().setTextSelection(8).resolveAnnotation(true).run();
    expect(editor.getText()).toBe('Hier  noch was.');
    editor.destroy();
  });
});
