import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { type EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  checkRevision,
  type Finding,
  type FindingKind,
  type RevisionResult,
  type TextBlock,
} from './revision-check';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    revision: {
      /** The hints are never stored in the document. */
      setRevisionMode: (enabled: boolean) => ReturnType;
      /** After the selection; wraps around at the end. */
      selectNextFinding: (kind: FindingKind) => ReturnType;
    };
  }
}

export interface RevisionOptions {
  /** Lowercase; read again on every check. */
  names: () => ReadonlySet<string>;
  describe: (finding: Finding) => string;
  /** Shortcut: toggle the mode (it is stored outside, in the settings). */
  toggle: () => void;
}

interface RevisionState {
  enabled: boolean;
  result: RevisionResult | null;
  decorations: DecorationSet;
}

export const revisionKey = new PluginKey<RevisionState>('revision');

/** `null` while the mode is off. */
export function revisionResult(state: EditorState): RevisionResult | null {
  return revisionKey.getState(state)?.result ?? null;
}

/**
 * Marks close repetitions, filler words, long sentences and doubled words as decorations – display
 * only, the document stays unchanged. Checked again on every change; at scene length that takes a
 * few milliseconds.
 */
export const Revision = Extension.create<RevisionOptions>({
  name: 'revision',

  addOptions() {
    return { names: () => new Set(), describe: () => '', toggle: () => undefined };
  },

  addCommands() {
    return {
      setRevisionMode:
        (enabled) =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(revisionKey, { enabled }));
          return true;
        },
      selectNextFinding:
        (kind) =>
        ({ state, chain }) => {
          const findings = revisionResult(state)?.findings.filter((f) => f.kind === kind) ?? [];
          const after = state.selection.from;
          const next = findings.find((f) => f.from > after) ?? findings[0];
          if (!next) return false;
          return chain()
            .focus()
            .setTextSelection({ from: next.from, to: next.to })
            .scrollIntoView()
            .run();
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-r': () => {
        this.options.toggle();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const compute = (doc: ProseMirrorNode): Omit<RevisionState, 'enabled'> => {
      const result = checkRevision(textBlocks(doc), options.names());
      const decorations = result.findings.map((finding) =>
        Decoration.inline(finding.from, finding.to, {
          class: `wm-rev wm-rev-${finding.kind}`,
          title: options.describe(finding),
        }),
      );
      return { result, decorations: DecorationSet.create(doc, decorations) };
    };

    return [
      new Plugin<RevisionState>({
        key: revisionKey,
        state: {
          init: () => ({ enabled: false, result: null, decorations: DecorationSet.empty }),
          apply: (tr, value, _old, state) => {
            const meta = tr.getMeta(revisionKey) as { enabled: boolean } | undefined;
            const enabled = meta?.enabled ?? value.enabled;
            if (!enabled) {
              return value.enabled
                ? { enabled: false, result: null, decorations: DecorationSet.empty }
                : value;
            }
            if (!meta && !tr.docChanged) return value;
            return { enabled, ...compute(state.doc) };
          },
        },
        props: {
          decorations: (state) => revisionKey.getState(state)?.decorations,
        },
      }),
    ];
  },
});

/**
 * Images and line breaks become a space – they take exactly one position like a character, so text
 * index = position − start.
 */
function textBlocks(doc: ProseMirrorNode): TextBlock[] {
  const blocks: TextBlock[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    blocks.push({ text: node.textBetween(0, node.content.size, undefined, ' '), start: pos + 1 });
    return false;
  });
  return blocks;
}
