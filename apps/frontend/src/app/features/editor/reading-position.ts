import { Injectable } from '@angular/core';
import type { Editor } from '@tiptap/core';
import type { EditorView } from '@tiptap/pm/view';

/** Where a document was left: cursor and scroll position. */
interface ReadingPosition {
  from: number;
  to: number;
  /**
   * Anchored to the text at the top edge rather than in pixels: the scene details above the text
   * load later and would otherwise shift everything. Plain pixels while the text does not reach
   * the top edge yet.
   */
  scroll: { pos: number; offset: number } | { top: number };
}

/** Kept for this session only – after a restart a document opens at the top again. */
@Injectable({ providedIn: 'root' })
export class ReadingPositions {
  private readonly positions = new Map<string, ReadingPosition>();

  /**
   * Puts the editor where the document was left and keeps track from then on. The returned
   * function stops that; call it while the editor is still in the page.
   */
  track(id: string, editor: Editor): () => void {
    const view = editor.view;
    const container = scrollParent(view.dom);
    const target: EventTarget = container === document.scrollingElement ? window : container;
    this.restore(id, editor, container);

    let frame = 0;
    const rememberScroll = () => {
      frame = 0;
      // Once the editor is out of the page, its coordinates mean nothing.
      if (view.dom.isConnected) this.entry(id, editor, container).scroll = anchor(view, container);
    };
    const onScroll = () => {
      frame ||= requestAnimationFrame(rememberScroll);
    };
    const onTransaction = () => {
      const { from, to } = editor.state.selection;
      Object.assign(this.entry(id, editor, container), { from, to });
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    editor.on('transaction', onTransaction);

    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('scroll', onScroll);
      editor.off('transaction', onTransaction);
      rememberScroll();
    };
  }

  private entry(id: string, editor: Editor, container: Element): ReadingPosition {
    let entry = this.positions.get(id);
    if (!entry) {
      const { from, to } = editor.state.selection;
      entry = { from, to, scroll: { top: container.scrollTop } };
      this.positions.set(id, entry);
    }
    return entry;
  }

  private restore(id: string, editor: Editor, container: Element): void {
    const saved = this.positions.get(id);
    // The scroll area is shared with the previous page – do not open halfway down.
    if (!saved) {
      container.scrollTop = 0;
      return;
    }
    const size = editor.state.doc.content.size;
    editor
      .chain()
      .setTextSelection({ from: Math.min(saved.from, size), to: Math.min(saved.to, size) })
      .focus(null, { scrollIntoView: false })
      .run();

    if ('top' in saved.scroll) {
      container.scrollTop = saved.scroll.top;
      return;
    }
    try {
      const line = editor.view.coordsAtPos(Math.min(saved.scroll.pos, size)).top;
      container.scrollTop += line - visibleTop(container) - saved.scroll.offset;
    } catch {
      // no layout (tests) – staying at the top is fine
    }
  }
}

function anchor(view: EditorView, container: Element): ReadingPosition['scroll'] {
  const top = visibleTop(container);
  const text = view.dom.getBoundingClientRect();
  if (text.top >= top) return { top: container.scrollTop };
  try {
    const hit = view.posAtCoords({ left: text.left + text.width / 2, top: top + 1 });
    if (hit) return { pos: hit.pos, offset: view.coordsAtPos(hit.pos).top - top };
  } catch {
    // no layout (tests)
  }
  return { top: container.scrollTop };
}

function visibleTop(container: Element): number {
  return container === document.scrollingElement ? 0 : container.getBoundingClientRect().top;
}

function scrollParent(element: HTMLElement): Element {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/auto|scroll/.test(getComputedStyle(parent).overflowY)) return parent;
  }
  return document.scrollingElement ?? document.documentElement;
}
