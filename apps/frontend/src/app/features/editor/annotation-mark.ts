import { getMarkRange, Mark, mergeAttributes } from '@tiptap/core';
import type {
  Mark as ProseMirrorMark,
  Node as ProseMirrorNode,
  ResolvedPos,
} from '@tiptap/pm/model';
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
       * Markierung am Cursor erledigen: mit `accept` den Vorschlag übernehmen (der markierte
       * Text wird ersetzt), sonst nur die Markierung entfernen. Der Text bleibt dabei formatiert.
       */
      resolveAnnotation: (accept: boolean) => ReturnType;
      /** Notiz der Markierung am Cursor setzen; leer oder `null` entfernt sie. */
      setAnnotationNote: (note: string | null) => ReturnType;
    };
  }
}

/**
 * Tiptap-Mark für Stellen, an denen noch etwas zu tun ist. Im Dokument:
 * `{ type: 'annotation', attrs: { kind: 'todo' | 'idea' | 'fixme', note, suggestion } }`,
 * im HTML: `<mark class="wm-annotation" data-annotation="todo">`.
 * `note` ist eine Notiz zur Stelle – im Editor eingetragen oder vom Korrekturlesen unterwegs;
 * `suggestion` (Ersetzungsvorschlag für den markierten Text) kommt nur vom Korrekturlesen.
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

      resolveAnnotation:
        (accept) =>
        ({ state, tr, dispatch }) => {
          const found = annotationAt(state);
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

      setAnnotationNote:
        (note) =>
        ({ state, tr, dispatch }) => {
          const found = annotationAt(state);
          if (!found) return false;
          if (dispatch) {
            const { kind, suggestion, from, to } = found;
            const type = state.schema.marks[this.name]!;
            tr.removeMark(from, to, type);
            tr.addMark(from, to, type.create({ kind, note: note?.trim() || null, suggestion }));
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

/** Eine Markierung samt Notiz und Vorschlag – für die Leiste über dem Text und die Liste. */
export interface AnnotationAt {
  kind: AnnotationKind;
  note: string | null;
  suggestion: string | null;
  /** Der markierte Text. */
  text: string;
  from: number;
  to: number;
}

/**
 * Sucht eine Markierung am Anfang der Auswahl – auch, wenn der Cursor genau an ihrem Anfang
 * steht.
 */
export function annotationAt(state: EditorState): AnnotationAt | null {
  const type = state.schema.marks['annotation'];
  if (!type) return null;
  const $from: ResolvedPos = state.selection.$from;
  const candidates = [...$from.marks(), ...($from.nodeAfter?.marks ?? [])];
  const mark = candidates.find((m) => m.type === type);
  if (!mark) return null;
  const range = getMarkRange($from, type, mark.attrs);
  if (!range) return null;
  return describe(state.doc, mark, range.from, range.to);
}

/**
 * Alle Markierungen im Dokument, in Textreihenfolge. Wie beim Zählen bleibt eine Markierung eine,
 * auch wenn darin z. B. ein Wort fett ist; sie endet am Absatzende.
 */
export function annotationsIn(doc: ProseMirrorNode): AnnotationAt[] {
  const type = doc.type.schema.marks['annotation'];
  if (!type) return [];
  const found: AnnotationAt[] = [];
  doc.descendants((block, blockPos) => {
    if (!block.isTextblock) return true;
    // `as`: sonst hält TypeScript `open` nach dem forEach für immer `null`
    let open = null as { mark: ProseMirrorMark; from: number; to: number } | null;
    block.forEach((child, offset) => {
      const from = blockPos + 1 + offset;
      const mark = type.isInSet(child.marks);
      if (open && mark?.eq(open.mark)) {
        open.to = from + child.nodeSize;
        return;
      }
      if (open) found.push(describe(doc, open.mark, open.from, open.to));
      open = mark ? { mark, from, to: from + child.nodeSize } : null;
    });
    if (open) found.push(describe(doc, open.mark, open.from, open.to));
    return false;
  });
  return found;
}

function describe(
  doc: ProseMirrorNode,
  mark: ProseMirrorMark,
  from: number,
  to: number,
): AnnotationAt {
  const text = doc.textBetween(from, to, ' ');
  const suggestion = mark.attrs['suggestion'] as string | null;
  return {
    kind: mark.attrs['kind'] as AnnotationKind,
    note: (mark.attrs['note'] as string | null) || null,
    // Ein Vorschlag, der nichts ändert, ist nur eine Notiz (nichts zu übernehmen)
    suggestion: suggestion === text ? null : suggestion,
    text,
    from,
    to,
  };
}
