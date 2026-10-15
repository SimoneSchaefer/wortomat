import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { QuoteStyle } from '@wortomat/shared';
import { SmartQuotes } from './smart-quotes';

/** Real Tiptap editor (jsdom); like the setting, the style can change at any time. */
function createEditor(content = '<p></p>') {
  let style: QuoteStyle = 'de';
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [StarterKit, SmartQuotes.configure({ style: () => style })],
    content,
  });
  return { editor, setStyle: (next: QuoteStyle) => (style = next) };
}

/** Types like the keyboard: input rules first, otherwise a plain insert. */
function type(editor: Editor, text: string): void {
  for (const char of text) {
    const { view } = editor;
    const { from, to } = view.state.selection;
    const handled = view.someProp('handleTextInput', (handle) =>
      handle(view, from, to, char, () => view.state.tr.insertText(char, from, to)),
    );
    if (!handled) view.dispatch(view.state.tr.insertText(char, from, to));
  }
}

const paragraph = (editor: Editor) => editor.state.doc.firstChild!.textContent;

describe('SmartQuotes', () => {
  it('replaces while typing and reads the setting on every character', () => {
    const { editor, setStyle } = createEditor();
    type(editor, `"Hallo", sagt's. `);
    setStyle('de-guillemets');
    type(editor, `"Tschüss"`);
    expect(paragraph(editor)).toBe('„Hallo“, sagt’s. »Tschüss«');
  });

  it('undoes the replacement with Backspace', () => {
    const { editor } = createEditor();
    type(editor, `Zoll: 12"`);
    editor.commands.undoInputRule();
    expect(paragraph(editor)).toBe('Zoll: 12"');
  });

  it('leaves code alone', () => {
    const { editor } = createEditor('<pre><code></code></pre>');
    type(editor, `x = "a"`);
    expect(paragraph(editor)).toBe('x = "a"');
  });

  it('replaces nothing when switched off', () => {
    const { editor, setStyle } = createEditor();
    setStyle('off');
    type(editor, `"a"`);
    expect(paragraph(editor)).toBe('"a"');
  });
});
