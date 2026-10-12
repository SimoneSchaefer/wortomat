import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { de } from '../../core/i18n/de';
import { Annotation } from './annotation-mark';

/** Echter Tiptap-Editor (jsdom) mit dem Satz „Hier fehlt noch was.“ */
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

/** [Text, Art der Markierung] je Textstück des ersten Absatzes. */
const marksOf = (editor: Editor) =>
  ((editor.getJSON().content?.[0]?.content ?? []) as TextJson[]).map((node) => [
    node.text,
    node.marks?.find((mark) => mark.type === 'annotation')?.attrs?.['kind'] ?? null,
  ]);

describe('Annotation (Todo/Idee/Fixme)', () => {
  it('markiert die Auswahl und rendert ein <mark> mit Art', () => {
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

  it('entfernt die ganze Markierung, wenn der Cursor darin steht', () => {
    const editor = createEditor();
    editor.chain().setTextSelection({ from: 6, to: 11 }).toggleAnnotation('idea').run();
    editor.chain().setTextSelection(8).toggleAnnotation('idea').run();
    expect(marksOf(editor)).toEqual([['Hier fehlt noch was.', null]]);
    editor.destroy();
  });

  it('ersetzt eine andere Art statt zu stapeln', () => {
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

  it('ohne Auswahl: schaltet „so weitertippen“ ein und wieder aus (Tastendruck für Tastendruck)', () => {
    const editor = createEditor();
    const typeKeys = (text: string) => {
      for (const char of text) editor.view.dispatch(editor.state.tr.insertText(char));
    };
    editor.commands.setTextSelection(21); // Ende des Absatzes
    typeKeys(' ');
    editor.commands.toggleAnnotation('todo');
    typeKeys('Namen?');
    editor.commands.toggleAnnotation('todo'); // direkt hinter der Markierung: ausschalten
    typeKeys(' Weiter.');
    expect(marksOf(editor)).toEqual([
      ['Hier fehlt noch was. ', null],
      ['Namen?', 'todo'],
      [' Weiter.', null],
    ]);
    editor.destroy();
  });

  it('entfernt mit Auswahl nur, wenn sie ganz markiert ist – sonst wird markiert', () => {
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

  it('liest Markierungen aus HTML (z. B. beim Einfügen aus der Zwischenablage)', () => {
    const editor = createEditor();
    editor.commands.setContent('<p><mark data-annotation="idea">Möwe?</mark></p>');
    expect(marksOf(editor)).toEqual([['Möwe?', 'idea']]);
    editor.destroy();
  });
});
