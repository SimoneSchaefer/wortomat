import { TestBed } from '@angular/core/testing';
import type { GalleryImage } from '@wortomat/shared';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { de } from '../../core/i18n/de';
import { StatusMessages } from '../../core/status-messages';
import { FakeApi, testImage } from '../../testing/fake-api';
import { button, findButton, key, render, startDrag, text, until } from '../../testing/render';
import { ImageGallery } from './image-gallery';

const LABEL = de.notes.profileImage;

async function setup(images: GalleryImage[] = []) {
  const api = new FakeApi();
  api.images.set('anna', images);
  const view = await render(ImageGallery, { api, inputs: { noteId: 'anna', label: LABEL } });
  const changes: GalleryImage[][] = [];
  view.fixture.componentInstance.changed.subscribe((list) => changes.push(list));
  await until(view.settle, () => api.noteImages.mock.calls.length > 0);
  await view.settle();
  const region = view.element.querySelector<HTMLElement>('[role=region]')!;
  /** Index of the visible slide – the others are hidden from assistive technology. */
  const current = () =>
    [...view.element.querySelectorAll('figure')].findIndex(
      (figure) => figure.getAttribute('aria-hidden') === 'false',
    );
  const pick = async (...files: File[]) => {
    const input = view.element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    const images = files.filter((file) => file.type.startsWith('image/')).length;
    await until(view.settle, () => api.addNoteImage.mock.calls.length === images);
    await view.settle();
  };
  return { ...view, api, region, current, pick, changes, confirm: TestBed.inject(ConfirmDialog) };
}

const png = (name: string) => new File(['png'], name, { type: 'image/png' });
const three = () => [testImage('eins'), testImage('zwei'), testImage('drei')];

describe('ImageGallery', () => {
  it('invites to add the first image while empty and opens the file picker', async () => {
    const { element } = await setup();
    const picker = element.querySelector<HTMLInputElement>('input[type=file]')!;
    const click = vi.spyOn(picker, 'click').mockImplementation(() => undefined);
    button(element, new RegExp(de.gallery.addFirst(LABEL))).click();
    expect(click).toHaveBeenCalled();
  });

  it('uploads picked images and reports the new list', async () => {
    const { api, pick, element, changes } = await setup();
    await pick(png('anna.png'), new File(['x'], 'notizen.txt', { type: 'text/plain' }));
    expect(api.addNoteImage).toHaveBeenCalledTimes(1);
    expect(api.addNoteImage).toHaveBeenCalledWith('anna', expect.any(File), 'anna.png', 800, 600);
    expect(element.querySelectorAll('figure img')).toHaveLength(1);
    expect(changes.at(-1)?.map((image) => image.originalName)).toEqual(['anna.png']);
  });

  it('uploads images dropped onto it, but ignores other drags', async () => {
    const { api, region, settle } = await setup();
    const text = startDrag();
    expect(text.fire(region, 'dragover').defaultPrevented).toBe(false);

    const files = startDrag({ files: [png('foto.png')] });
    expect(files.fire(region, 'dragover').defaultPrevented).toBe(true);
    files.fire(region, 'drop');
    await until(settle, () => api.addNoteImage.mock.calls.length === 1);
  });

  it('pages through several images with buttons, dots and arrow keys', async () => {
    const { element, region, current, settle } = await setup(three());
    expect(current()).toBe(0);
    expect(button(element, de.gallery.previous).disabled).toBe(true);

    button(element, de.gallery.next).click();
    await settle();
    expect(current()).toBe(1);

    button(element, de.gallery.image(3)).click();
    await settle();
    expect(current()).toBe(2);
    expect(button(element, de.gallery.next).disabled).toBe(true);

    key(region, 'ArrowLeft');
    await settle();
    expect(current()).toBe(1);
  });

  it('labels the first image as profile picture and can promote another one', async () => {
    const { api, element, settle, changes } = await setup(three());
    expect(text(element.querySelector('.badge'))).toBe(LABEL);
    expect(findButton(element, de.gallery.makeCover(LABEL))).toBeNull();

    button(element, de.gallery.image(3)).click();
    await settle();
    button(element, de.gallery.makeCover(LABEL)).click();
    await until(settle, () => changes.length > 0);
    expect(api.reorderNoteImages).toHaveBeenCalledWith('anna', ['drei', 'eins', 'zwei']);
    expect(changes.at(-1)?.[0]?.id).toBe('drei');
  });

  it('removes the current image after confirmation', async () => {
    const { api, element, confirm, settle } = await setup(three());
    button(element, de.gallery.next).click();
    await settle();
    button(element, de.gallery.remove).click();
    await settle();
    expect(confirm.pending()?.title).toBe(de.gallery.removeTitle);
    confirm.answer(true);
    await until(settle, () => element.querySelectorAll('figure').length === 2);
    expect(api.removeNoteImage).toHaveBeenCalledWith('anna', 'zwei');
  });

  it('keeps the image when removing is cancelled', async () => {
    const { api, element, confirm, settle } = await setup(three());
    button(element, de.gallery.remove).click();
    await settle();
    confirm.answer(false);
    await settle();
    expect(api.removeNoteImage).not.toHaveBeenCalled();
  });

  it('opens the crop dialog and saves the chosen crop', async () => {
    const { api, element, settle } = await setup(three());
    button(element, de.gallery.crop).click();
    await settle();
    expect(element.querySelector('wm-image-crop-dialog')).not.toBeNull();

    button(element, de.gallery.cropReset).click();
    await until(settle, () => !element.querySelector('wm-image-crop-dialog'));
    expect(api.setNoteImageCrop).toHaveBeenCalledWith('anna', 'eins', null);
  });

  it('shows a cropped image so the crop fills the frame', async () => {
    const crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
    const { element } = await setup([testImage('eins', { crop })]);
    const image = element.querySelector<HTMLImageElement>('figure img')!;
    expect(image.classList).toContain('cropped');
    expect(image.style.width).toBe('200%');
  });

  it('reports when the gallery cannot be loaded', async () => {
    const api = new FakeApi();
    api.noteImages.mockRejectedValueOnce(new Error('kaputt'));
    const view = await render(ImageGallery, { api, inputs: { noteId: 'anna', label: LABEL } });
    await until(view.settle, () => TestBed.inject(StatusMessages).messages().length > 0);
    expect(TestBed.inject(StatusMessages).messages()[0]!.text).toBe('kaputt');
  });
});
