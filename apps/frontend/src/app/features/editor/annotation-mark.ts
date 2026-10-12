import { Mark, mergeAttributes } from '@tiptap/core';
import type { Mark as ProseMirrorMark } from '@tiptap/pm/model';
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
    };
  }
}

/**
 * Tiptap-Mark für Stellen, an denen noch etwas zu tun ist. Im Dokument:
 * `{ type: 'annotation', attrs: { kind: 'todo' | 'idea' | 'fixme' } }`,
 * im HTML: `<mark class="wm-annotation" data-annotation="todo">`.
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
        renderHTML: (attributes) => ({
          'data-annotation': attributes['kind'],
          title: label(attributes['kind'] as AnnotationKind),
        }),
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
