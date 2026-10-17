import { getMarkRange, Mark, mergeAttributes } from '@tiptap/core';
import type {
  Mark as ProseMirrorMark,
  Node as ProseMirrorNode,
  ResolvedPos,
} from '@tiptap/pm/model';
import { type EditorState, TextSelection } from '@tiptap/pm/state';
import type { AnnotationKind } from '@wortomat/shared';
import { ANNOTATION_KINDS } from '../../core/annotations';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    annotation: {
      /**
       * Like bold, with one addition:
       * - Text selected: mark it, or unmark it if it is fully marked like that already. Another
       *   kind is replaced (a passage always has just one kind).
       * - Cursor inside a mark of this kind: remove the whole mark.
       * - Otherwise: toggle "keep typing like this".
       */
      toggleAnnotation: (kind: AnnotationKind) => ReturnType;
      /**
       * With `accept` the suggestion is applied (replacing the marked text), otherwise only the
       * mark is removed. The text keeps its formatting.
       */
      resolveAnnotation: (accept: boolean) => ReturnType;
      /** Empty or `null` removes it. */
      setAnnotationNote: (note: string | null) => ReturnType;
    };
  }
}

/**
 * Tiptap mark for passages where something is still to do. In the document: `{ type: 'annotation',
 * attrs: { kind: 'todo' | 'idea' | 'fixme', note, suggestion } }`, in HTML: `<mark
 * class="wm-annotation" data-annotation="todo">`. `note` is a note on the passage – entered in the
 * editor or from proofreading on the go; `suggestion` (a replacement for the marked text) only
 * comes from proofreading. Counted in the backend (apps/backend/src/manuscript/annotations.ts).
 */
export interface AnnotationOptions {
  /** Tooltip of the mark, e.g. "Todo" – read when rendering. */
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
            // Check ourselves: Tiptap's isActive() already reports "active" for a partial mark.
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
          // Empty selection: setMark/unsetMark act on the stored marks for further typing.
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
            // insertText keeps the other marks (italic …); an empty suggestion = delete
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
    return Object.fromEntries(
      ANNOTATION_KINDS.map(({ kind, key }) => [
        `Mod-Alt-${key.toLowerCase()}`,
        () => this.editor.commands.toggleAnnotation(kind),
      ]),
    );
  },
});

export interface AnnotationAt {
  kind: AnnotationKind;
  note: string | null;
  suggestion: string | null;
  text: string;
  from: number;
  to: number;
}

/** At the start of the selection – also when the cursor sits exactly at the mark's start. */
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
 * As when counting, a mark stays one even if a word in it is bold; it ends at the end of the
 * paragraph.
 */
export function annotationsIn(doc: ProseMirrorNode): AnnotationAt[] {
  const type = doc.type.schema.marks['annotation'];
  if (!type) return [];
  const found: AnnotationAt[] = [];
  doc.descendants((block, blockPos) => {
    if (!block.isTextblock) return true;
    // `as`: otherwise TypeScript considers `open` to be `null` forever after the forEach
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
    // A suggestion that changes nothing is just a note (nothing to apply)
    suggestion: suggestion === text ? null : suggestion,
    text,
    from,
    to,
  };
}
