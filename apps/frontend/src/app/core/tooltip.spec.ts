import { Component } from '@angular/core';
import { render, text } from '../testing/render';
import { Tooltip } from './tooltip';

@Component({
  imports: [Tooltip],
  template: `
    <button type="button" id="save" title="Speichern">S</button>
    <button type="button" id="undo" title="Rückgängig">U</button>
    <span id="cell" data-tip="Mo., 5. Okt.: 300 geschrieben"><i>·</i></span>
    <p id="plain">ohne Hinweis</p>
    <wm-tooltip />
  `,
})
class Host {}

async function setup() {
  const view = await render(Host);
  const el = (id: string) => view.element.querySelector<HTMLElement>(`#${id}`)!;
  const tip = () => view.element.querySelector<HTMLElement>('.tooltip')!;
  const shown = () => (tip().hasAttribute('data-popover-open') ? text(tip()) : null);
  const over = (target: Element, from: Element | null = null) => {
    from?.dispatchEvent(
      new PointerEvent('pointerout', {
        bubbles: true,
        relatedTarget: target,
        pointerType: 'mouse',
      }),
    );
    target.dispatchEvent(
      new PointerEvent('pointerover', { bubbles: true, relatedTarget: from, pointerType: 'mouse' }),
    );
  };
  const out = (target: Element) =>
    target.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse' }));
  return { ...view, el, shown, over, out };
}

describe('Tooltip', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows the title after a short delay and parks it meanwhile, so the browser shows none', async () => {
    const { el, shown, over, out } = await setup();
    over(el('save'));
    expect(shown()).toBeNull();
    expect(el('save').hasAttribute('title')).toBe(false);

    vi.advanceTimersByTime(500);
    expect(shown()).toBe('Speichern');

    out(el('save'));
    expect(shown()).toBeNull();
    expect(el('save').getAttribute('title')).toBe('Speichern');
  });

  it('switches at once to the next element while one is showing', async () => {
    const { el, shown, over } = await setup();
    over(el('save'));
    vi.advanceTimersByTime(500);
    over(el('undo'), el('save'));
    expect(shown()).toBe('Rückgängig');
    expect(el('save').getAttribute('title')).toBe('Speichern');
  });

  it('reads data-tip for purely visual elements, also when hovering a child', async () => {
    const { el, shown, over } = await setup();
    over(el('cell').querySelector('i')!);
    vi.advanceTimersByTime(500);
    expect(shown()).toBe('Mo., 5. Okt.: 300 geschrieben');
  });

  it('ignores elements without a hint', async () => {
    const { el, shown, over } = await setup();
    over(el('plain'));
    vi.advanceTimersByTime(500);
    expect(shown()).toBeNull();
  });

  it('hides on click and keeps the title parked until the pointer leaves', async () => {
    const { el, shown, over, out } = await setup();
    over(el('save'));
    vi.advanceTimersByTime(500);
    el('save').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(shown()).toBeNull();
    expect(el('save').hasAttribute('title')).toBe(false);
    out(el('save'));
    expect(el('save').getAttribute('title')).toBe('Speichern');
  });

  it('shows on keyboard focus without taking the title away', async () => {
    const { el, shown } = await setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    el('undo').focus();
    vi.advanceTimersByTime(500);
    expect(shown()).toBe('Rückgängig');
    expect(el('undo').getAttribute('title')).toBe('Rückgängig');

    el('undo').blur();
    expect(shown()).toBeNull();
  });

  it('stays quiet when focus comes from a click', async () => {
    const { el, shown } = await setup();
    el('undo').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el('undo').focus();
    vi.advanceTimersByTime(500);
    expect(shown()).toBeNull();
  });
});
