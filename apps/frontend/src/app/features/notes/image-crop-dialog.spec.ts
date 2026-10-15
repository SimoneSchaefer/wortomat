import type { ImageCrop } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { button, key, render } from '../../testing/render';
import { ImageCropDialog } from './image-crop-dialog';

// 1600 × 1200 shown on a 400 × 300 stage: 1 % of the image = 4 px across, 3 px down.
async function setup(initial: ImageCrop | null = null, aspect = 1) {
  const view = await render(ImageCropDialog, {
    inputs: { url: '/api/images/foto', initial, aspect },
  });
  const applied: Array<ImageCrop | null> = [];
  let cancelled = 0;
  view.fixture.componentInstance.applied.subscribe((crop) => applied.push(crop));
  view.fixture.componentInstance.cancelled.subscribe(() => cancelled++);

  const image = view.element.querySelector('img')!;
  Object.defineProperties(image, { naturalWidth: { value: 1600 }, naturalHeight: { value: 1200 } });
  image.dispatchEvent(new Event('load'));
  const stage = view.element.querySelector<HTMLElement>('.stage')!;
  stage.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 300 }) as DOMRect;
  await view.settle();

  const frame = () => view.element.querySelector<HTMLElement>('.frame')!;
  /** The frame in percent of the image, as the template positions it. */
  const box = () => {
    const style = frame().style;
    return [style.left, style.top, style.width, style.height].map(
      (v) => Math.round(parseFloat(v) * 10) / 10,
    );
  };
  const pointer = (target: Element, type: string, x: number, y: number) =>
    target.dispatchEvent(
      new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, clientX: x, clientY: y }),
    );
  return {
    ...view,
    dialog: view.element.querySelector('dialog')!,
    frame,
    box,
    pointer,
    applied,
    cancelled: () => cancelled,
  };
}

describe('ImageCropDialog', () => {
  it('opens as a modal and starts with the largest centred crop', async () => {
    const { dialog, box } = await setup();
    expect(dialog.open).toBe(true);
    // square on a 4:3 image: full height, three quarters of the width
    expect(box()).toEqual([12.5, 0, 75, 100]);
  });

  it('starts with the crop chosen before', async () => {
    const { box } = await setup({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
    expect(box()).toEqual([10, 20, 30, 40]);
  });

  it('moves with the arrow keys – faster with Shift – and stays inside the image', async () => {
    const { frame, box, settle } = await setup({ x: 0.1, y: 0.1, width: 0.3, height: 0.4 });
    key(frame(), 'ArrowRight');
    key(frame(), 'ArrowDown', { shiftKey: true });
    await settle();
    expect(box()).toEqual([11, 15, 30, 40]);

    for (let i = 0; i < 30; i++) key(frame(), 'ArrowLeft', { shiftKey: true });
    await settle();
    expect(box()[0]).toBe(0);
  });

  it('resizes with + and − around the centre, keeping the aspect ratio', async () => {
    const { frame, box, settle } = await setup({ x: 0.3, y: 0.3, width: 0.3, height: 0.4 });
    key(frame(), '-');
    await settle();
    const [left, top, width, height] = box();
    expect(width! / height!).toBeCloseTo(0.75, 1);
    expect(left! + width! / 2).toBeCloseTo(45, 0);
    expect(top! + height! / 2).toBeCloseTo(50, 0);
  });

  it('moves the frame by dragging', async () => {
    const { frame, box, pointer, settle } = await setup({
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.4,
    });
    pointer(frame(), 'pointerdown', 100, 100);
    pointer(frame(), 'pointermove', 140, 130);
    pointer(frame(), 'pointerup', 140, 130);
    await settle();
    expect(box()).toEqual([20, 20, 30, 40]);
  });

  it('resizes at a corner while the opposite corner stays put', async () => {
    const { element, frame, box, pointer, settle } = await setup({
      x: 0.1,
      y: 0.1,
      width: 0.3,
      height: 0.4,
    });
    pointer(element.querySelector('.handle.se')!, 'pointerdown', 160, 150);
    pointer(frame(), 'pointermove', 200, 150);
    await settle();
    const [left, top, width, height] = box();
    expect([left, top]).toEqual([10, 10]);
    expect(width).toBe(40);
    expect(width! / height!).toBeCloseTo(0.75, 1);
  });

  it('reports the chosen crop, "whole image" or cancelling', async () => {
    const { element, dialog, applied, cancelled } = await setup({
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    });
    button(element, de.gallery.cropApply).click();
    button(element, de.gallery.cropReset).click();
    expect(applied).toEqual([{ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }, null]);

    button(element, de.confirm.cancel).click();
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(cancelled()).toBe(2);
  });
});
