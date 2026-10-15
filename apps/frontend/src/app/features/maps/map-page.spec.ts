import { TestBed } from '@angular/core/testing';
import type { UpdateMapRequest } from '@wortomat/shared';
import { de } from '../../core/i18n/de';
import { PendingSaves } from '../../core/pending-saves';
import { StatusMessages } from '../../core/status-messages';
import { FakeApi, testMap, testNote } from '../../testing/fake-api';
import { button, key, render, text, type, until } from '../../testing/render';
import { NotesStore } from '../notes/notes-store';
import { MapPage } from './map-page';
import { MapsStore } from './maps-store';

const M = de.maps;
const COAST = { tool: 'pen' as const, color: '#3d3530', width: 4, points: [100, 100, 300, 100] };

async function setup(options: { place?: string; strokes?: (typeof COAST)[] } = {}) {
  const api = new FakeApi();
  api.notes = [
    testNote('hafen', 'place', { title: 'Hafen' }),
    testNote('leuchtturm', 'place', { title: 'Leuchtturm' }),
    testNote('anna', 'character', { title: 'Anna' }),
  ];
  api.maps.set(
    'kueste',
    testMap('kueste', {
      name: 'Küste',
      strokes: options.strokes ?? [COAST],
      pins: [{ noteId: 'hafen', x: 400, y: 300 }],
    }),
  );
  const view = await render(MapPage, {
    api,
    inputs: { id: 'kueste', place: options.place },
    providers: [NotesStore, MapsStore],
    before: () =>
      Promise.all([TestBed.inject(NotesStore).load(), TestBed.inject(MapsStore).load()]),
  });
  await until(view.settle, () => !!view.element.querySelector('svg.canvas'));
  const canvas = view.element.querySelector<SVGSVGElement>('svg.canvas')!;
  // Screen pixels = map units: the canvas is exactly as large as the map.
  canvas.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 1600, height: 1000, right: 1600, bottom: 1000 }) as DOMRect;
  const pointer = (target: Element, kind: string, x: number, y: number, init = {}) =>
    target.dispatchEvent(
      new PointerEvent(kind, {
        bubbles: true,
        button: 0,
        pointerId: 1,
        clientX: x,
        clientY: y,
        ...init,
      }),
    );
  const stroke = async (points: Array<[number, number]>) => {
    const [first, ...rest] = points;
    pointer(canvas, 'pointerdown', ...first!);
    for (const point of rest) pointer(canvas, 'pointermove', ...point);
    pointer(canvas, 'pointerup', ...points.at(-1)!);
    await view.settle();
  };
  const paths = () => canvas.querySelectorAll('path.pen, path.area').length;
  /** The last request that reached the backend, after saving whatever is pending. */
  const saved = async (): Promise<UpdateMapRequest | undefined> => {
    await TestBed.inject(PendingSaves).flushAll();
    return api.updateMap.mock.calls.at(-1)?.[1];
  };
  const tool = (name: string) => button(view.element.querySelector('.tools')!, name);
  return { ...view, canvas, pointer, stroke, paths, saved, tool };
}

describe('MapPage', () => {
  it('shows the drawing, its places and which places are still missing', async () => {
    const { element, canvas, paths } = await setup();
    expect(canvas.getAttribute('aria-label')).toBe(M.canvasLabel('Küste'));
    expect(paths()).toBe(1);
    expect([...canvas.querySelectorAll('.pin text')].map(text)).toEqual(['Hafen']);
    const places = element.querySelector('aside.places')!;
    expect([...places.querySelectorAll('button:not(.placed)')].map(text)).toEqual(['Leuchtturm']);
    expect([...places.querySelectorAll('button.placed')].map(text)).toEqual(['Hafen']);
  });

  it('starts with "Move", so looking around never draws by accident', async () => {
    const { tool, stroke, paths } = await setup();
    expect(tool(M.hand).getAttribute('aria-pressed')).toBe('true');
    await stroke([
      [100, 500],
      [400, 500],
    ]);
    expect(paths()).toBe(1);
  });

  it('draws a stroke with the pen and saves it', async () => {
    const { tool, stroke, paths, saved, settle } = await setup();
    tool(M.pen).click();
    await settle();
    await stroke([
      [100, 500],
      [200, 520],
      [300, 500],
      [400, 540],
    ]);
    expect(paths()).toBe(2);
    const request = await saved();
    expect(request?.strokes).toHaveLength(2);
    expect(request?.strokes?.[1]).toMatchObject({ tool: 'pen', color: '#3d3530' });
  });

  it('picks a colour – and switches to the pen if needed', async () => {
    const { element, tool, settle } = await setup();
    button(element, M.colors.water).click();
    await settle();
    expect(tool(M.pen).getAttribute('aria-pressed')).toBe('true');
    expect(button(element, M.colors.water).getAttribute('aria-pressed')).toBe('true');
  });

  it('undoes and redoes with the buttons and the keyboard', async () => {
    const { element, tool, stroke, paths, settle, saved } = await setup();
    tool(M.pen).click();
    await settle();
    await stroke([
      [100, 600],
      [500, 600],
    ]);
    expect(paths()).toBe(2);

    button(element, M.undo).click();
    await settle();
    expect(paths()).toBe(1);
    expect((await saved())?.strokes).toHaveLength(1);

    key(element.querySelector('.map-page') ?? element, 'z', { ctrlKey: true, shiftKey: true });
    await settle();
    expect(paths()).toBe(2);
  });

  it('erases a stroke it touches', async () => {
    const { tool, stroke, paths, settle } = await setup();
    tool(M.eraser).click();
    await settle();
    await stroke([[200, 100]]);
    expect(paths()).toBe(0);
  });

  it('places a picked place with the next click and shows its popover', async () => {
    const { element, canvas, pointer, settle, saved } = await setup();
    button(element.querySelector('aside.places')!, 'Leuchtturm').click();
    await settle();
    expect(text(element.querySelector('.placing-hint'))).toBe(M.placing('Leuchtturm'));

    pointer(canvas, 'pointerdown', 800, 200);
    await settle();
    expect([...canvas.querySelectorAll('.pin text')].map(text)).toEqual(['Hafen', 'Leuchtturm']);
    expect(text(element.querySelector('.pin-popover strong'))).toBe('Leuchtturm');
    expect((await saved())?.pins).toContainEqual({ noteId: 'leuchtturm', x: 800, y: 200 });
  });

  it('takes a place off the map from its popover', async () => {
    const { element, canvas, settle } = await setup();
    button(element.querySelector('aside.places')!, 'Hafen').click();
    await settle();
    button(element.querySelector('.pin-popover')!, M.removePin).click();
    await settle();
    expect(canvas.querySelector('.pin')).toBeNull();
  });

  it('cancels placing with Escape', async () => {
    const { element, settle } = await setup();
    button(element.querySelector('aside.places')!, 'Leuchtturm').click();
    await settle();
    key(element.querySelector('aside.places button')!, 'Escape');
    await settle();
    expect(element.querySelector('.placing-hint')).toBeNull();
  });

  it('comes from a place page ready to place it (?place=)', async () => {
    const { element } = await setup({ place: 'leuchtturm' });
    expect(text(element.querySelector('.placing-hint'))).toBe(M.placing('Leuchtturm'));
  });

  it('zooms with + and − and back to the whole map with 0', async () => {
    const { element, canvas, settle } = await setup();
    const target = element.querySelector('.tools button')!;
    key(target, '+');
    await settle();
    expect(canvas.getAttribute('viewBox')).not.toBe('0 0 1600 1000');
    expect(button(element, new RegExp(M.zoomFit)).getAttribute('aria-label')).toBe(
      `${M.zoomFit} (150 %)`,
    );
    key(target, '0');
    await settle();
    expect(canvas.getAttribute('viewBox')).toBe('0 0 1600 1000');
  });

  it('renames the map, but never to an empty name', async () => {
    const { element, settle, saved } = await setup();
    const name = element.querySelector<HTMLInputElement>(`input[aria-label="${M.name}"]`)!;
    type(name, 'Nordküste');
    expect((await saved())?.name).toBe('Nordküste');

    type(name, ' ');
    await settle();
    name.dispatchEvent(new Event('blur'));
    await settle();
    expect(name.value).toBe('Küste');
  });

  it('rejects a background in an unsupported format', async () => {
    const { element, settle, api } = await setup();
    const input = element.querySelector<HTMLInputElement>('input[type=file]')!;
    Object.defineProperty(input, 'files', { value: [new File(['%PDF'], 'skizze.pdf')] });
    input.dispatchEvent(new Event('change'));
    await until(settle, () => TestBed.inject(StatusMessages).messages().length > 0);
    expect(TestBed.inject(StatusMessages).messages()[0]?.text).toBe(M.unsupportedImage);
    expect(api.uploadImage).not.toHaveBeenCalled();
  });

  it('says so when the map no longer exists', async () => {
    const api = new FakeApi();
    const view = await render(MapPage, {
      api,
      inputs: { id: 'weg' },
      providers: [NotesStore, MapsStore],
    });
    await until(view.settle, () => !!view.element.querySelector('.not-found'));
    expect(text(view.element.querySelector('.not-found'))).toBe(M.notFound);
  });
});
