import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MapPin, MapStroke, NoteSummary, PlaceMap, UpdateMapRequest } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { isSupportedImage, prepareImage } from '../../core/image-resize';
import { PendingSaves } from '../../core/pending-saves';
import { StatusMessages } from '../../core/status-messages';
import { WortomatApi } from '../../core/wortomat-api';
import { NotesStore } from '../notes/notes-store';
import { hitsStroke, simplify, smooth, strokePath } from './map-drawing';
import { MapsStore } from './maps-store';

const SAVE_DELAY_MS = 800;
const MAX_HISTORY = 100;
const PLACE_DRAG_TYPE = 'application/x-wortomat-place';
/** Canvas width in map units (as in the backend); the height follows the image. */
const MAP_WIDTH = 1600;
/** 1 = the whole map. */
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.5;

type Tool = 'pen' | 'area' | 'eraser' | 'hand' | 'zoom';

/** Colours for rough maps – easy to tell apart on light paper. */
export const MAP_COLORS = [
  { key: 'ink', value: '#3d3530' },
  { key: 'water', value: '#2f6fbf' },
  { key: 'forest', value: '#3f7f3a' },
  { key: 'earth', value: '#8a5a2b' },
  { key: 'road', value: '#b8402f' },
  { key: 'sand', value: '#c99a2e' },
] as const;

/** Stroke widths in screen pixels at 100 % – stored in map units. */
const WIDTHS = [2, 4, 9] as const;

/**
 * Smoothing while drawing: spacing of the points and how many neighbours per side are averaged –
 * together about 15 screen pixels, enough against mouse jitter without blurring corners.
 */
const SMOOTH_SPACING = 2.5;
const SMOOTH_RADIUS = 6;

interface Snapshot {
  strokes: MapStroke[];
  pins: MapPin[];
}

/** In map units. */
interface View {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Start and current point in map units. */
interface ZoomDrag {
  pointerId: number;
  startX: number;
  startY: number;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface PinDrag {
  noteId: string;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  before: Snapshot;
}

@Component({
  selector: 'wm-map-page',
  imports: [RouterLink],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '(document:keyup)': 'onKeyup($event)',
    '(window:blur)': 'spaceHeld.set(false)',
  },
})
export class MapPage {
  readonly id = input.required<string>();
  /** `?place=<id>` (from a place's page): select it, or queue it for placing. */
  readonly place = input<string>();

  protected readonly t = inject(I18n).t;
  protected readonly shortcut = inject(I18n).shortcut;
  private readonly api = inject(WortomatApi);
  private readonly maps = inject(MapsStore);
  private readonly notes = inject(NotesStore);
  private readonly injector = inject(Injector);
  private readonly error = inject(StatusMessages).channel();
  private readonly canvas = viewChild<ElementRef<SVGSVGElement>>('canvas');
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  protected readonly tools: readonly Tool[] = ['pen', 'area', 'eraser', 'hand', 'zoom'];
  protected readonly colors = MAP_COLORS;
  protected readonly widths = WIDTHS;

  protected readonly map = signal<PlaceMap | null>(null);
  protected readonly notFound = signal(false);
  protected readonly nameDraft = signal('');
  protected readonly strokes = signal<MapStroke[]>([]);
  protected readonly pins = signal<MapPin[]>([]);
  protected readonly backgroundOpacity = signal(1);
  protected readonly uploading = signal(false);

  /** Starts with "Move" – otherwise you easily draw by accident while looking around. */
  protected readonly tool = signal<Tool>('hand');
  protected readonly color = signal<string>(MAP_COLORS[0].value);
  protected readonly widthIndex = signal(1);
  /** Colour and stroke width only apply to drawing tools. */
  protected readonly drawing = computed(() => this.tool() === 'pen' || this.tool() === 'area');

  private readonly undoStack = signal<Snapshot[]>([]);
  private readonly redoStack = signal<Snapshot[]>([]);
  protected readonly canUndo = computed(() => this.undoStack().length > 0);
  protected readonly canRedo = computed(() => this.redoStack().length > 0);

  protected readonly view = signal<View>({ x: 0, y: 0, w: MAP_WIDTH, h: 1000 });
  protected readonly viewBox = computed(() => {
    const { x, y, w, h } = this.view();
    return `${x} ${y} ${w} ${h}`;
  });
  protected readonly zoom = computed(() => (this.map()?.width ?? this.view().w) / this.view().w);
  protected readonly zoomPercent = computed(() => this.t().number(Math.round(this.zoom() * 100)));
  protected readonly maxZoom = MAX_ZOOM;
  private readonly canvasWidth = signal(0);
  /**
   * Map units per screen pixel – places and text stay the same size when zooming, new strokes the
   * same thickness on screen (so finer when zoomed in).
   */
  protected readonly unit = computed(() => {
    const width = this.canvasWidth();
    return width > 0 ? this.view().w / width : 1;
  });
  /** Space held: dragging moves the view (like the hand tool). */
  protected readonly spaceHeld = signal(false);
  protected readonly panning = signal(false);
  private pan: { pointerId: number; lastX: number; lastY: number } | null = null;
  protected readonly draft = signal<number[] | null>(null);
  /** For the circle under the mouse pointer. */
  protected readonly eraserAt = signal<{ x: number; y: number } | null>(null);
  private erasing: { pointerId: number; before: Snapshot } | null = null;
  private readonly zoomDrag = signal<ZoomDrag | null>(null);
  protected readonly zoomArea = computed(() => {
    const drag = this.zoomDrag();
    if (!drag) return null;
    const { start, end } = drag;
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      w: Math.abs(end.x - start.x),
      h: Math.abs(end.y - start.y),
    };
  });
  private pinDrag: PinDrag | null = null;

  /** Shows "Open" and "Remove from map". */
  protected readonly selectedPin = signal<string | null>(null);
  /** Placed with the next click on the map. */
  protected readonly placing = signal<string | null>(null);
  protected readonly dropActive = signal(false);

  protected readonly renderedStrokes = computed(() =>
    this.strokes().map((stroke) => ({
      stroke,
      d: strokePath(stroke.points, stroke.tool === 'area'),
    })),
  );
  protected readonly draftPath = computed(() => {
    const points = this.draft();
    const closed = this.tool() === 'area';
    return points ? strokePath(this.smoothed(points, closed), closed) : null;
  });

  private readonly places = computed(() => this.notes.byKind('place'));
  protected readonly placedPins = computed(() =>
    this.pins().flatMap((pin) => {
      const note = this.notes.find(pin.noteId);
      return note ? [{ pin, note }] : [];
    }),
  );
  protected readonly unplaced = computed(() => {
    const placed = new Set(this.pins().map((pin) => pin.noteId));
    return this.places().filter((note) => !placed.has(note.id));
  });
  protected readonly placedNotes = computed(() => {
    const placed = new Set(this.pins().map((pin) => pin.noteId));
    return this.places().filter((note) => placed.has(note.id));
  });
  protected readonly selected = computed(() =>
    this.placedPins().find((entry) => entry.pin.noteId === this.selectedPin()),
  );
  /** Position in percent of the view; `null` outside. */
  protected readonly popover = computed(() => {
    const entry = this.selected();
    const view = this.view();
    if (!entry) return null;
    const left = ((entry.pin.x - view.x) / view.w) * 100;
    const top = ((entry.pin.y - view.y) / view.h) * 100;
    return left < 0 || left > 100 || top < 0 || top > 100 ? null : { entry, left, top };
  });
  protected readonly placingNote = computed(() => {
    const id = this.placing();
    return id ? this.notes.find(id) : undefined;
  });
  protected readonly isEmpty = computed(
    () =>
      !this.strokes().length &&
      !this.pins().length &&
      !this.draft() &&
      !this.map()?.backgroundImageId,
  );

  private pending: { id: string; request: UpdateMapRequest } | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private loadCounter = 0;

  constructor() {
    const unregister = inject(PendingSaves).register(() => this.flush());
    const resize = new ResizeObserver(() => this.measure());
    inject(DestroyRef).onDestroy(() => {
      unregister();
      resize.disconnect();
      void this.flush();
    });

    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      resize.disconnect();
      if (canvas) resize.observe(canvas);
    });
  }

  private async load(id: string): Promise<void> {
    void this.flush(); // changes of the previous map
    const loadId = ++this.loadCounter;
    this.error.set(null);
    this.selectedPin.set(null);
    this.placing.set(null);
    this.tool.set('hand');
    this.undoStack.set([]);
    this.redoStack.set([]);
    try {
      const map = await this.api.map(id);
      if (loadId !== this.loadCounter) return;
      this.map.set(map);
      this.fitView();
      this.notFound.set(false);
      this.nameDraft.set(map.name);
      this.strokes.set(map.strokes);
      this.pins.set(map.pins);
      this.backgroundOpacity.set(map.backgroundOpacity);
      const place = untracked(this.place);
      if (place && this.notes.find(place)) {
        if (map.pins.some((pin) => pin.noteId === place)) this.selectedPin.set(place);
        else this.placing.set(place);
      }
      // Freshly created? Then select the name right away for overwriting.
      if (map.name === this.t().maps.newName && !map.strokes.length) {
        afterNextRender(
          () => {
            this.nameInput()?.nativeElement.focus();
            this.nameInput()?.nativeElement.select();
          },
          { injector: this.injector },
        );
      }
    } catch (error) {
      if (loadId !== this.loadCounter) return;
      this.map.set(null);
      this.notFound.set(true);
      this.error.set(errorMessage(error, this.t()));
    }
  }

  private measure(): void {
    const width = this.canvas()?.nativeElement.getBoundingClientRect().width ?? 0;
    if (width > 0) this.canvasWidth.set(width);
  }

  protected fitView(): void {
    const map = this.map();
    if (map) this.view.set({ x: 0, y: 0, w: map.width, h: map.height });
  }

  /** `factor` < 1 zooms out; the point `center` stays in place. */
  protected zoomBy(factor: number, center?: { x: number; y: number }): void {
    const map = this.map();
    if (!map) return;
    const view = this.view();
    const zoom = Math.min(MAX_ZOOM, Math.max(1, (map.width / view.w) * factor));
    const w = map.width / zoom;
    const h = map.height / zoom;
    const cx = center?.x ?? view.x + view.w / 2;
    const cy = center?.y ?? view.y + view.h / 2;
    this.setView({
      x: cx - (cx - view.x) * (w / view.w),
      y: cy - (cy - view.y) * (h / view.h),
      w,
      h,
    });
  }

  /** As large as possible (the map's aspect ratio stays). */
  private zoomTo(area: View): void {
    const map = this.map();
    if (!map || area.w <= 0 || area.h <= 0) return;
    // The whole area must fit – the tighter direction decides the zoom
    const fit = Math.min(map.width / area.w, map.height / area.h);
    const zoom = Math.min(MAX_ZOOM, Math.max(1, fit));
    const w = map.width / zoom;
    const h = map.height / zoom;
    this.setView({ x: area.x + area.w / 2 - w / 2, y: area.y + area.h / 2 - h / 2, w, h });
  }

  /** In screen pixels (positive = right/down). */
  private scrollView(dx: number, dy: number): void {
    const view = this.view();
    const unit = this.unit();
    this.setView({ ...view, x: view.x + dx * unit, y: view.y + dy * unit });
  }

  /** The view stays within the map. */
  private setView(view: View): void {
    const map = this.map();
    if (!map) return;
    this.view.set({
      ...view,
      x: Math.min(map.width - view.w, Math.max(0, view.x)),
      y: Math.min(map.height - view.h, Math.max(0, view.y)),
    });
  }

  /**
   * Ctrl + mouse wheel or a two-finger pinch on the trackpad zooms; otherwise the wheel moves the
   * view.
   */
  protected onWheel(event: WheelEvent): void {
    const lines = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      this.zoomBy(Math.exp(-event.deltaY * lines * 0.002), this.toMap(event) ?? undefined);
    } else if (this.zoom() > 1) {
      event.preventDefault();
      const [dx, dy] =
        event.shiftKey && !event.deltaX ? [event.deltaY, 0] : [event.deltaX, event.deltaY];
      this.scrollView(dx * lines, dy * lines);
    }
  }

  protected onNameInput(value: string): void {
    this.nameDraft.set(value);
    if (value.trim()) this.queue({ name: value });
  }

  protected onNameBlur(): void {
    if (!this.nameDraft().trim()) this.nameDraft.set(this.map()?.name ?? '');
  }

  protected selectTool(tool: Tool): void {
    this.tool.set(tool);
    this.placing.set(null);
  }

  protected selectColor(color: string): void {
    this.color.set(color);
    if (!this.drawing()) this.tool.set('pen');
  }

  protected selectWidth(index: number): void {
    this.widthIndex.set(index);
    if (!this.drawing()) this.tool.set('pen');
  }

  protected undo(): void {
    const previous = this.undoStack().at(-1);
    if (!previous) return;
    this.undoStack.update((stack) => stack.slice(0, -1));
    this.redoStack.update((stack) => [...stack, this.snapshot()]);
    this.restore(previous);
  }

  protected redo(): void {
    const next = this.redoStack().at(-1);
    if (!next) return;
    this.redoStack.update((stack) => stack.slice(0, -1));
    this.undoStack.update((stack) => [...stack, this.snapshot()]);
    this.restore(next);
  }

  private snapshot(): Snapshot {
    return { strokes: this.strokes(), pins: this.pins() };
  }

  private restore(snapshot: Snapshot): void {
    this.strokes.set(snapshot.strokes);
    this.pins.set(snapshot.pins);
    if (!snapshot.pins.some((pin) => pin.noteId === this.selectedPin())) {
      this.selectedPin.set(null);
    }
    this.queue({ strokes: snapshot.strokes, pins: snapshot.pins });
  }

  private commit(before: Snapshot): void {
    this.undoStack.update((stack) => [...stack.slice(-(MAX_HISTORY - 1)), before]);
    this.redoStack.set([]);
    this.queue({ strokes: this.strokes(), pins: this.pins() });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as Element | null;
    if (target?.closest('input, textarea, [contenteditable], dialog')) return;
    if (event.key === ' ' && !target?.closest('button, a, select')) {
      event.preventDefault(); // do not scroll
      this.spaceHeld.set(true);
      return;
    }
    if (!event.ctrlKey && !event.metaKey && !event.altKey && this.map()) {
      if (event.key === '+' || event.key === '=') return this.zoomBy(ZOOM_STEP);
      if (event.key === '-') return this.zoomBy(1 / ZOOM_STEP);
      if (event.key === '0') return this.fitView();
    }
    if (event.key === 'Escape') {
      if (this.placing() || this.selectedPin()) {
        this.placing.set(null);
        this.selectedPin.set(null);
        event.stopPropagation();
      }
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      this.redo();
    }
  }

  protected onKeyup(event: KeyboardEvent): void {
    if (event.key === ' ') this.spaceHeld.set(false);
  }

  private toMap(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const canvas = this.canvas()?.nativeElement;
    const map = this.map();
    if (!canvas || !map) return null;
    const rect = canvas.getBoundingClientRect();
    const view = this.view();
    return {
      x: view.x + ((event.clientX - rect.left) / rect.width) * view.w,
      y: view.y + ((event.clientY - rect.top) / rect.height) * view.h,
    };
  }

  /** Moving: hand tool, held space bar or middle mouse button. */
  private pansWith(event: PointerEvent): boolean {
    return event.button === 1 || this.tool() === 'hand' || this.spaceHeld();
  }

  protected onPointerDown(event: PointerEvent): void {
    const placing = this.placing();
    if (this.pansWith(event) && !(placing && event.button === 0 && !this.spaceHeld())) {
      event.preventDefault();
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
      this.pan = { pointerId: event.pointerId, lastX: event.clientX, lastY: event.clientY };
      this.panning.set(true);
      return;
    }
    if (event.button !== 0) return;
    const point = this.toMap(event);
    if (!point) return;
    event.preventDefault();
    if (placing) {
      this.setPin(placing, point.x, point.y);
      this.placing.set(null);
      return;
    }
    this.selectedPin.set(null);
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    if (this.tool() === 'zoom') {
      this.zoomDrag.set({
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        start: point,
        end: point,
      });
    } else if (this.tool() === 'eraser') {
      this.erasing = { pointerId: event.pointerId, before: this.snapshot() };
      this.eraseAt(point.x, point.y);
    } else {
      this.draft.set([point.x, point.y]);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    if (this.pan?.pointerId === event.pointerId) {
      this.scrollView(this.pan.lastX - event.clientX, this.pan.lastY - event.clientY);
      this.pan.lastX = event.clientX;
      this.pan.lastY = event.clientY;
      return;
    }
    const point = this.toMap(event);
    if (!point) return;
    if (this.pinDrag?.pointerId === event.pointerId) {
      this.movePin(event, point);
      return;
    }
    const zoomDrag = this.zoomDrag();
    if (zoomDrag?.pointerId === event.pointerId) {
      const map = this.map()!;
      const end = {
        x: Math.min(map.width, Math.max(0, point.x)),
        y: Math.min(map.height, Math.max(0, point.y)),
      };
      this.zoomDrag.set({ ...zoomDrag, end });
      return;
    }
    this.eraserAt.set(this.tool() === 'eraser' && !this.placing() ? point : null);
    if (this.erasing?.pointerId === event.pointerId) {
      this.eraseAt(point.x, point.y);
      return;
    }
    const draft = this.draft();
    if (!draft) return;
    // Intermediate points the browser coalesced make fast strokes rounder
    const events = event.getCoalescedEvents?.() ?? [];
    const points = [...draft];
    const minDistance = 1.5 * this.unit();
    for (const sample of events.length ? events : [event]) {
      const p = this.toMap(sample);
      if (!p) continue;
      const lastX = points[points.length - 2]!;
      const lastY = points[points.length - 1]!;
      if (Math.hypot(p.x - lastX, p.y - lastY) >= minDistance) points.push(p.x, p.y);
    }
    if (points.length !== draft.length) this.draft.set(points);
  }

  protected onPointerUp(event: PointerEvent): void {
    if (this.pan?.pointerId === event.pointerId) {
      this.pan = null;
      this.panning.set(false);
      return;
    }
    if (this.pinDrag?.pointerId === event.pointerId) {
      this.endPinDrag();
      return;
    }
    const zoomDrag = this.zoomDrag();
    if (zoomDrag?.pointerId === event.pointerId) {
      const area = this.zoomArea()!;
      this.zoomDrag.set(null);
      if (event.type === 'pointercancel') return;
      // Just clicked: one step closer (further away with Alt), the point stays in place
      if (Math.hypot(event.clientX - zoomDrag.startX, event.clientY - zoomDrag.startY) < 4) {
        this.zoomBy(event.altKey ? 1 / ZOOM_STEP : ZOOM_STEP, zoomDrag.start);
      } else {
        this.zoomTo(area);
      }
      return;
    }
    if (this.erasing?.pointerId === event.pointerId) {
      const { before } = this.erasing;
      this.erasing = null;
      if (before.strokes !== this.strokes()) this.commit(before);
      return;
    }
    const draft = this.draft();
    if (!draft) return;
    this.draft.set(null);
    const tool = this.tool();
    if (tool !== 'pen' && tool !== 'area') return;
    const points = simplify(this.smoothed(draft, tool === 'area'), 0.4 * this.unit());
    if (tool === 'area' && points.length < 6) return; // an area needs at least three points
    const before = this.snapshot();
    const width = WIDTHS[this.widthIndex()]! * this.unit();
    this.strokes.update((strokes) => [
      ...strokes,
      { tool, color: this.color(), width: Math.round(width * 10) / 10, points },
    ]);
    this.commit(before);
  }

  /** Measured in screen pixels – so correspondingly finer when zoomed. */
  private smoothed(points: readonly number[], closed: boolean): number[] {
    return smooth(points, SMOOTH_SPACING * this.unit(), SMOOTH_RADIUS, closed);
  }

  protected onPointerLeave(): void {
    this.eraserAt.set(null);
  }

  private eraseAt(x: number, y: number): void {
    const radius = 8 * this.unit();
    const strokes = this.strokes();
    const remaining = strokes.filter((stroke) => !hitsStroke(stroke, x, y, radius));
    if (remaining.length !== strokes.length) this.strokes.set(remaining);
  }

  protected onPinPointerDown(event: PointerEvent, noteId: string): void {
    const tool = this.tool();
    if (
      event.button !== 0 ||
      this.placing() ||
      tool === 'hand' ||
      tool === 'zoom' ||
      this.spaceHeld()
    ) {
      return; // then dragging moves or zooms the view
    }
    event.stopPropagation();
    event.preventDefault();
    this.canvas()?.nativeElement.setPointerCapture(event.pointerId);
    this.pinDrag = {
      noteId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      before: this.snapshot(),
    };
  }

  private movePin(event: PointerEvent, point: { x: number; y: number }): void {
    const drag = this.pinDrag!;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) {
      return;
    }
    drag.moved = true;
    this.selectedPin.set(null);
    const map = this.map()!;
    const x = Math.min(map.width, Math.max(0, point.x));
    const y = Math.min(map.height, Math.max(0, point.y));
    this.pins.update((pins) =>
      pins.map((pin) => (pin.noteId === drag.noteId ? { ...pin, x, y } : pin)),
    );
  }

  private endPinDrag(): void {
    const drag = this.pinDrag!;
    this.pinDrag = null;
    if (drag.moved) {
      this.commit(drag.before);
    } else {
      // Just clicked: select, or deselect again
      this.selectedPin.update((current) => (current === drag.noteId ? null : drag.noteId));
    }
  }

  private setPin(noteId: string, x: number, y: number): void {
    const before = this.snapshot();
    this.pins.update((pins) => [...pins.filter((pin) => pin.noteId !== noteId), { noteId, x, y }]);
    this.selectedPin.set(noteId);
    this.commit(before);
  }

  protected removePin(noteId: string): void {
    const before = this.snapshot();
    this.pins.update((pins) => pins.filter((pin) => pin.noteId !== noteId));
    this.selectedPin.set(null);
    this.commit(before);
  }

  /** In the list on the right: select placed places, queue the others for placing. */
  protected pickPlace(note: NoteSummary): void {
    if (this.pins().some((pin) => pin.noteId === note.id)) {
      this.placing.set(null);
      this.selectedPin.set(note.id);
    } else {
      this.selectedPin.set(null);
      this.placing.update((current) => (current === note.id ? null : note.id));
    }
  }

  protected onPlaceDragStart(event: DragEvent, note: NoteSummary): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(PLACE_DRAG_TYPE, note.id);
  }

  protected onDragOver(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes(PLACE_DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dropActive.set(true);
  }

  protected onDrop(event: DragEvent): void {
    this.dropActive.set(false);
    const noteId = event.dataTransfer?.getData(PLACE_DRAG_TYPE);
    const point = this.toMap(event);
    if (!noteId || !point || !this.notes.find(noteId)) return;
    event.preventDefault();
    this.placing.set(null);
    this.setPin(noteId, point.x, point.y);
  }

  protected async onBackgroundSelected(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    const map = this.map();
    if (!file || !map) return;
    if (!isSupportedImage(file)) {
      this.error.set(this.t().maps.unsupportedImage);
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    try {
      const image = await prepareImage(file);
      const uploaded = await this.api.uploadImage(
        image.blob,
        image.fileName,
        image.width,
        image.height,
      );
      // The canvas takes over the image's aspect ratio
      const height = Math.round((MAP_WIDTH * image.height) / image.width);
      await this.saveNow(map.id, {
        backgroundImageId: uploaded.id,
        width: MAP_WIDTH,
        height: Math.min(10_000, Math.max(100, height)),
      });
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.uploading.set(false);
    }
  }

  protected async removeBackground(): Promise<void> {
    const map = this.map();
    if (!map) return;
    try {
      await this.saveNow(map.id, { backgroundImageId: null });
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  protected onOpacityInput(value: string): void {
    const opacity = Number(value);
    this.backgroundOpacity.set(opacity);
    this.queue({ backgroundOpacity: opacity });
  }

  private queue(patch: UpdateMapRequest): void {
    const id = this.map()?.id;
    if (!id) return;
    const previous = this.pending?.id === id ? this.pending.request : {};
    this.pending = { id, request: { ...previous, ...patch } };
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  /** Image and size right away – together with everything still waiting to be saved. */
  private async saveNow(id: string, patch: UpdateMapRequest): Promise<void> {
    const previous = this.pending?.id === id ? this.pending.request : {};
    this.pending = null;
    clearTimeout(this.saveTimer);
    const saved = await this.api.updateMap(id, { ...previous, ...patch });
    this.maps.updated(saved);
    if (this.map()?.id === id) {
      // Drawing and places stay as on screen – they may have changed meanwhile
      this.map.set(saved);
      this.fitView(); // the size may have changed with the image
      afterNextRender(() => this.measure(), { injector: this.injector });
    }
  }

  private async flush(): Promise<void> {
    clearTimeout(this.saveTimer);
    const pending = this.pending;
    this.pending = null;
    if (!pending || !this.maps.find(pending.id)) return;
    try {
      const saved = await this.api.updateMap(pending.id, pending.request);
      this.maps.updated(saved);
      this.error.set(null);
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
