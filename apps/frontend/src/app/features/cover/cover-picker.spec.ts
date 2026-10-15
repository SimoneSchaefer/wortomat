import { TestBed } from '@angular/core/testing';
import { de } from '../../core/i18n/de';
import { ProjectStore } from '../../core/project-store';
import { FakeApi, testProject } from '../../testing/fake-api';
import { button, render, startDrag, text, until } from '../../testing/render';
import { CoverPicker } from './cover-picker';

async function setup(coverImageId: string | null = null) {
  const api = new FakeApi();
  api.project = testProject({ coverImageId });
  const view = await render(CoverPicker, {
    api,
    inputs: { hint: 'Erscheint auf der Startseite.' },
    before: () => TestBed.inject(ProjectStore).reload(),
  });
  const store = TestBed.inject(ProjectStore);
  const pick = async (file: File) => {
    const input = view.element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    // Done once the cover changed or the picker explains why not.
    await until(
      view.settle,
      () => api.updateProject.mock.calls.length > 0 || !!view.element.querySelector('[role=alert]'),
    );
  };
  return { ...view, store, pick };
}

const png = (name = 'cover.png') => new File(['png'], name, { type: 'image/png' });

describe('CoverPicker', () => {
  it('invites to add a cover while there is none', async () => {
    const { element } = await setup();
    expect(button(element, new RegExp(de.gallery.addFirst(de.export.cover)))).toBeTruthy();
    expect(text(element.querySelector('.cover-actions p'))).toContain(
      'Erscheint auf der Startseite.',
    );
  });

  it('uploads a picked image and sets it as the cover', async () => {
    const { api, element, pick, settle, store } = await setup();
    await pick(png());
    expect(api.uploadImage).toHaveBeenCalledWith(expect.any(File), 'cover.png', 800, 600);
    expect(api.updateProject).toHaveBeenCalledWith({ coverImageId: 'bild-1' });
    await until(settle, () => !!element.querySelector('img'));
    expect(store.project()?.coverImageId).toBe('bild-1');
    expect(element.querySelector('img')?.getAttribute('src')).toBe('/api/images/bild-1');
  });

  it('takes a dropped image, but no other drags', async () => {
    const { api, element, settle } = await setup();
    const frame = element.querySelector('.cover-frame')!;
    expect(startDrag().fire(frame, 'dragover').defaultPrevented).toBe(false);

    const drop = startDrag({ files: [png('drop.png')] });
    expect(drop.fire(frame, 'dragover').defaultPrevented).toBe(true);
    drop.fire(frame, 'drop');
    await until(settle, () => api.updateProject.mock.calls.length > 0);
  });

  it('rejects files that are no supported image', async () => {
    const { api, element, pick } = await setup();
    await pick(new File(['%PDF'], 'cover.pdf', { type: 'application/pdf' }));
    expect(api.uploadImage).not.toHaveBeenCalled();
    expect(text(element.querySelector('[role=alert]'))).toBe(de.export.unsupportedImage);
  });

  it('removes the cover', async () => {
    const { api, element, settle, store } = await setup('alt');
    button(element, de.export.removeCover).click();
    await until(settle, () => store.project()?.coverImageId === null);
    expect(api.updateProject).toHaveBeenCalledWith({ coverImageId: null });
  });

  it('reports when a cover cannot be designed (no canvas)', async () => {
    // jsdom has no 2D canvas – like a browser without OffscreenCanvas support.
    const { element, settle } = await setup();
    button(element, de.export.designCover).click();
    await until(settle, () => !!element.querySelector('[role=alert]'));
  });
});
