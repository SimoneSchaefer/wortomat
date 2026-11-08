import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { type EditorState, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { textBlocks } from './revision';
import type { TextBlock } from './revision-check';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    find: {
      /** `null` ends the search. Starts at the first match. */
      setFind: (query: string | null) => ReturnType;
      /** Wraps around at both ends. */
      findStep: (direction: 1 | -1) => ReturnType;
    };
  }
}

export interface FindOptions {
  /** Ctrl+F in the text. */
  open: () => void;
  /** Escape in the text while searching. */
  close: () => void;
  /** After F3 / Shift+F3. */
  stepped: () => void;
}

export interface FindMatch {
  from: number;
  to: number;
}

interface FindState {
  query: string | null;
  matches: FindMatch[];
  current: number;
  decorations: DecorationSet;
}

export interface FindInfo {
  count: number;
  /** Index into the matches; 0 without any. */
  current: number;
  match: FindMatch | null;
}

const findKey = new PluginKey<FindState>('find');

/** `null` while not searching. */
export function findInfo(state: EditorState): FindInfo | null {
  const find = findKey.getState(state);
  if (!find || find.query === null) return null;
  return {
    count: find.matches.length,
    current: find.current,
    match: find.matches[find.current] ?? null,
  };
}

/**
 * Highlights the search term in the text and steps through the matches – display only, the
 * document stays unchanged.
 */
export const Find = Extension.create<FindOptions>({
  name: 'find',

  addOptions() {
    return { open: () => undefined, close: () => undefined, stepped: () => undefined };
  },

  addCommands() {
    return {
      setFind:
        (query) =>
        ({ tr, dispatch }) => {
          dispatch?.(tr.setMeta(findKey, { query }));
          return true;
        },
      findStep:
        (direction) =>
        ({ state, tr, dispatch }) => {
          const find = findKey.getState(state);
          if (!find?.matches.length) return false;
          const count = find.matches.length;
          dispatch?.(tr.setMeta(findKey, { current: (find.current + direction + count) % count }));
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    const searching = () => findKey.getState(this.editor.state)?.query != null;
    const step = (direction: 1 | -1) => {
      if (!searching()) return false;
      this.editor.commands.findStep(direction);
      this.options.stepped();
      return true;
    };
    return {
      'Mod-f': () => {
        this.options.open();
        return true;
      },
      F3: () => step(1),
      'Shift-F3': () => step(-1),
      Escape: () => {
        if (!searching()) return false;
        this.options.close();
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const build = (doc: ProseMirrorNode, query: string | null, current: number): FindState => {
      const matches = query === null ? [] : findMatches(textBlocks(doc), query);
      const index = Math.min(current, Math.max(0, matches.length - 1));
      const decorations = matches.map((match, i) =>
        Decoration.inline(match.from, match.to, {
          class: i === index ? 'wm-find wm-find-current' : 'wm-find',
        }),
      );
      return {
        query,
        matches,
        current: index,
        decorations: DecorationSet.create(doc, decorations),
      };
    };

    return [
      new Plugin<FindState>({
        key: findKey,
        state: {
          init: () => ({ query: null, matches: [], current: 0, decorations: DecorationSet.empty }),
          apply: (tr, value, _old, state) => {
            const meta = tr.getMeta(findKey) as
              { query?: string | null; current?: number } | undefined;
            if (meta && 'query' in meta) return build(state.doc, meta.query ?? null, 0);
            if (value.query === null) return value;
            if (meta?.current !== undefined) return build(state.doc, value.query, meta.current);
            if (tr.docChanged) return build(state.doc, value.query, value.current);
            return value;
          },
        },
        props: {
          decorations: (state) => findKey.getState(state)?.decorations,
        },
      }),
    ];
  },
});

/**
 * Matches like the search in the sidebar (SQLite FTS5, unicode61 with remove_diacritics): words
 * that start with one of the terms, case and accents ignored. Only the typed part is highlighted.
 */
export function findMatches(blocks: readonly TextBlock[], query: string): FindMatch[] {
  const terms = [...new Set(query.split(/[^\p{L}\p{N}]+/u).map(fold))]
    .filter(Boolean)
    // Longest first: "Haus" and "Hausflur" both match "Hausflur…" – mark the longer part
    .sort((a, b) => b.length - a.length);
  if (!terms.length) return [];

  const matches: FindMatch[] = [];
  for (const block of blocks) {
    for (const word of block.text.matchAll(/[\p{L}\p{N}\p{M}]+/gu)) {
      const length = matchedLength(word[0], terms);
      if (length) {
        const from = block.start + word.index;
        matches.push({ from, to: from + length });
      }
    }
  }
  return matches;
}

/** Characters of `word` covered by the longest term it starts with; 0 if none. */
function matchedLength(word: string, terms: readonly string[]): number {
  let folded = '';
  // Folded length → original length, since one character can fold to none or several
  const ends = new Map<number, number>();
  for (let i = 0; i < word.length; i++) {
    folded += fold(word[i]!);
    ends.set(folded.length, i + 1);
  }
  for (const term of terms) {
    if (folded.startsWith(term)) return ends.get(term.length) ?? word.length;
  }
  return 0;
}

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}
