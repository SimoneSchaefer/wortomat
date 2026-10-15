import { Extension } from '@tiptap/core';
import type { EditorState, Transaction } from '@tiptap/pm/state';

/** Deeper than this only squeezes the text column. */
export const MAX_INDENT = 4;
const TYPES = ['paragraph', 'heading'];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /** In a list: makes the item a sub-item. Elsewhere: indents the paragraphs one step. */
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

/** Block indentation as an `indent` attribute (0–4); the exports read it too. */
export const Indent = Extension.create({
  name: 'indent',

  addGlobalAttributes() {
    return [
      {
        types: TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => clamp(Number(element.getAttribute('data-indent')) || 0),
            renderHTML: (attributes) =>
              attributes['indent'] ? { 'data-indent': attributes['indent'] } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ editor, commands, state, tr, dispatch }) =>
          editor.isActive('listItem')
            ? commands.sinkListItem('listItem')
            : shiftBlocks(state, tr, 1, !!dispatch),
      outdent:
        () =>
        ({ editor, commands, state, tr, dispatch }) =>
          editor.isActive('listItem')
            ? commands.liftListItem('listItem')
            : shiftBlocks(state, tr, -1, !!dispatch),
    };
  },
});

function shiftBlocks(state: EditorState, tr: Transaction, step: number, apply: boolean): boolean {
  let changed = false;
  for (const { $from, $to } of state.selection.ranges) {
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (!TYPES.includes(node.type.name)) return true;
      const indent = clamp((node.attrs['indent'] as number) + step);
      if (indent !== node.attrs['indent']) {
        changed = true;
        if (apply) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent });
      }
      return false;
    });
  }
  return changed;
}

function clamp(indent: number): number {
  return Math.max(0, Math.min(MAX_INDENT, Math.round(indent)));
}
