import { key, render } from '../../testing/render';
import { ResizeHandle } from './resize-handle';

async function setup(value = 300) {
  const view = await render(ResizeHandle, {
    inputs: { value, min: 256, max: 600, label: 'Breite der Seitenleiste' },
  });
  const resized: number[] = [];
  let resets = 0;
  view.fixture.componentInstance.resized.subscribe((width) => resized.push(width));
  view.fixture.componentInstance.reset.subscribe(() => resets++);
  return { ...view, resized, resets: () => resets };
}

describe('ResizeHandle', () => {
  it('is a labelled window splitter with its current value', async () => {
    const { element } = await setup();
    expect(element.getAttribute('role')).toBe('separator');
    expect(element.getAttribute('aria-label')).toBe('Breite der Seitenleiste');
    expect(element.getAttribute('aria-valuenow')).toBe('300');
    expect([element.getAttribute('aria-valuemin'), element.getAttribute('aria-valuemax')]).toEqual([
      '256',
      '600',
    ]);
  });

  it('changes the width with the arrow keys – in large steps with Shift – and Home/End', async () => {
    const { element, resized } = await setup();
    key(element, 'ArrowRight');
    key(element, 'ArrowLeft', { shiftKey: true });
    key(element, 'Home');
    key(element, 'End');
    expect(resized).toEqual([316, 256, 256, 600]);
  });

  it('follows the pointer anywhere on the page and stays within its limits', async () => {
    const { element, resized } = await setup();
    element.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 300 }));
    expect(document.body.classList).toContain('wm-resizing');
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 350 }));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 1000 }));
    document.dispatchEvent(new PointerEvent('pointerup'));
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 320 }));
    expect(resized).toEqual([350, 600]);
    expect(document.body.classList).not.toContain('wm-resizing');
  });

  it('resets on double-click', async () => {
    const { element, resets } = await setup();
    element.dispatchEvent(new MouseEvent('dblclick'));
    expect(resets()).toBe(1);
  });
});
