import { getMarkRange, Mark, mergeAttributes } from '@tiptap/core';
import type { Mark as ProseMirrorMark, ResolvedPos } from '@tiptap/pm/model';
import { type EditorState, TextSelection } from '@tiptap/pm/state';
import type { AnnotationKind } from '@wortomat/shared';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      /**
       * Wie Fett, mit einer Ergänzung:
       * - Text ausgewählt: markieren bzw. entfernen, wenn er schon ganz so markiert ist.
       *   Eine andere Art wird ersetzt (eine Stelle hat immer nur eine Art).
       * - Cursor mitten in einer Markierung dieser Art: die ganze Markierung entfernen.
       * - Sonst: „ab hier so weitertippen“ ein- bzw. ausschalten.
       */
      toggleAnnotation: (kind: AnnotationKind) => ReturnType;
      /**
       * Korrekturnotiz am Cursor erledigen: mit `accept` den Vorschlag übernehmen (der markierte
       * Text wird ersetzt), sonst nur die Markierung entfernen. Der Text bleibt dabei formatiert.
       */
      resolveProofNote: (accept: boolean) => ReturnType;
    };
  }
}

/**
 * Tiptap-Mark für Stellen, an denen noch etwas zu tun ist. Im Dokument:
 * `{ type: 'annotation', attrs: { kind: 'todo' | 'idea' | 'fixme', note, suggestion } }`,
 * im HTML: `<mark class="wm-annotation" data-annotation="todo">`.
 * `note` und `suggestion` kommen aus dem Korrekturlesen unterwegs (Notiz bzw. Ersetzungsvorschlag
 * für den markierten Text); selbst gesetzte Markierungen haben beides nicht.
 * Gezählt wird im Backend (apps/backend/src/manuscript/annotations.ts).
 */
export interface AnnotationOptions {
  /** Tooltip der Markierung, z. B. „Todo“ – wird beim Darstellen gelesen. */
  label: (kind: AnnotationKind) => string;
}

export const Annotation = Mark.create<AnnotationOptions>({
  name: 'annotation',

  addOptions() {
    return { label: (kind) => kind };
  },

  addAttributes() {
    const label = (kind: AnnotationKind) => this.options.label(kind);
    return {
      kind: {
        default: 'todo',
        parseHTML: (element) => element.getAttribute('data-annotation'),
        renderHTML: (attributes) => {
          const title = label(attributes['kind'] as AnnotationKind);
          const note = attributes['note'] as string | null;
          return {
            'data-annotation': attributes['kind'],
            title: note ? `${title}: ${note}` : title,
          };
        },
      },
      note: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-note'),
        renderHTML: (attributes) => (attributes['note'] ? { 'data-note': attributes['note'] } : {}),
      },
      suggestion: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion'),
        renderHTML: (attributes) =>
          attributes['suggestion'] === null ? {} : { 'data-suggestion': attributes['suggestion'] },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'mark[data-annotation]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes({ class: 'wm-annotation' }, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      toggleAnnotation:
        (kind) =>
        ({ state, chain }) => {
          const type = state.schema.marks[this.name]!;
          const isKind = (mark: ProseMirrorMark) =>
            mark.type === type && mark.attrs['kind'] === kind;
          const { empty, $from } = state.selection;

          if (!empty) {
            // Selbst prüfen: Tiptaps isActive() meldet schon bei teilweiser Markierung „aktiv“.
            let fullyMarked = true;
            state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
              if (node.isText && !node.marks.some(isKind)) fullyMarked = false;
            });
            return fullyMarked
              ? chain().unsetMark(this.name).run()
              : chain().setMark(this.name, { kind }).run();
          }

          const inside =
            !!$from.nodeBefore?.marks.some(isKind) && !!$from.nodeAfter?.marks.some(isKind);
          if (inside) {
            return chain()
              .extendMarkRange(this.name, { kind })
              .unsetMark(this.name)
              .setTextSelection($from.pos)
              .run();
          }
          // Leere Auswahl: setMark/unsetMark wirken auf die „gespeicherten“ Marks fürs Weitertippen.
          const typingAs = (state.storedMarks ?? $from.marks()).some(isKind);
          return typingAs
            ? chain().unsetMark(this.name).run()
            : chain().setMark(this.name, { kind }).run();
        },

      resolveProofNote:
        (accept) =>
        ({ state, tr, dispatch }) => {
          const found = proofNoteAt(state);
          if (!found) return false;
          if (dispatch) {
            const { from, to, suggestion } = found;
            tr.removeMark(from, to, state.schema.marks[this.name]);
            // insertText übernimmt die übrigen Marks (kursiv …); leerer Vorschlag = löschen
            const replace = accept && suggestion !== null;
            if (replace) tr.insertText(suggestion, from, to);
            const end = replace ? from + suggestion.length : to;
            tr.setSelection(TextSelection.create(tr.doc, end));
          }
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-t': () => this.editor.commands.toggleAnnotation('todo'),
      'Mod-Alt-i': () => this.editor.commands.toggleAnnotation('idea'),
      'Mod-Alt-f': () => this.editor.commands.toggleAnnotation('fixme'),
    };
  },
});

/** Korrekturnotiz (Notiz und/oder Vorschlag) am Cursor – für die Leiste über dem Text. */
export interface ProofNoteAt {
  note: string | null;
  suggestion: string | null;
  /** Der markierte Text. */
  text: string;
  from: number;
  to: number;
}

/**
 * Sucht eine Markierung mit Notiz oder Vorschlag am Anfang der Auswahl – auch, wenn der Cursor
 * genau an ihrem Anfang steht.
 */
export function proofNoteAt(state: EditorState): ProofNoteAt | null {
  const type = state.schema.marks['annotation'];
  if (!type) return null;
  const $from: ResolvedPos = state.selection.$from;
  const candidates = [...$from.marks(), ...($from.nodeAfter?.marks ?? [])];
  const mark = candidates.find(
    (m) => m.type === type && (!!m.attrs['note'] || m.attrs['suggestion'] !== null),
  );
  if (!mark) return null;
  const range = getMarkRange($from, type, mark.attrs);
  if (!range) return null;
  const text = state.doc.textBetween(range.from, range.to, ' ');
  const suggestion = mark.attrs['suggestion'] as string | null;
  return {
    note: (mark.attrs['note'] as string | null) || null,
    // Ein Vorschlag, der nichts ändert, ist nur eine Notiz (nichts zu übernehmen)
    suggestion: suggestion === text ? null : suggestion,
    text,
    from: range.from,
    to: range.to,
  };
}
