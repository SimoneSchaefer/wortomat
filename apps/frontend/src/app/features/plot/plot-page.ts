import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  type ElementRef,
  inject,
  Injector,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { PlotViewSettings, StoryMark, Strand } from '@wortomat/shared';
import { AppSettingsStore } from '../../core/app-settings';
import { Autofocus } from '../../core/autofocus';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { Mascot } from '../../core/mascot';
import { ProjectStore } from '../../core/project-store';
import { statusInfo } from '../../core/scene-status';
import { StatusMessages } from '../../core/status-messages';
import { strandColor } from '../../core/strands';
import { WortomatApi } from '../../core/wortomat-api';
import { scenesInOrder } from '../stats/stats';
import {
  layoutPlot,
  linePath,
  NODE_SIZE,
  PLOT_GEOMETRY,
  type PlotColumn,
  type PlotColumnInput,
  type PlotGroup,
  type PlotLane,
  type PlotLine,
  type PlotGroupInfo,
  type PlotNode,
  type PlotScene,
} from './plot-layout';
import {
  displacedScenes,
  type DropTarget,
  type ManuscriptMove,
  manuscriptPlan,
  marksByColumn,
  moveScene,
  remapMark,
  storyColumns,
} from './story-order';

/** Half diagonal of the diamond – a little larger than a circle so it has the same area. */
const DIAMOND_RADIUS = NODE_SIZE * 0.68;

const HEADER_HEIGHT = 30;

/** Screen coordinates of an SVG rectangle. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** From this distance a click turns into a drag. */
const DRAG_THRESHOLD_PX = 4;

/** This close to the column edge (share of a column), dropping counts as before/after. */
const EDGE_SHARE = 0.25;

/** Where a dragged scene would land – relative to the displayed columns. */
type Hit = { join: number } | { gap: number };

interface LaneDrag {
  strand: Strand;
  /** Pointer position across the time axis, minus the row's own offset. */
  start: number;
  /** Index of the row it would land on when released. */
  target: number;
}

interface Drag {
  node: PlotNode;
  /** Pointer position along the time axis. */
  start: number;
  moved: boolean;
  delta: number;
  hit: Hit | null;
}

interface MarkDraft {
  /** `null` = new mark */
  id: string | null;
  /** Before this story column (all scenes, not only the displayed ones). */
  beforeColumn: number;
  /** Along the time axis. */
  x: number;
  label: string;
}

const START_SECTION: PlotGroupInfo = { id: 'start', label: '', number: null };

/**
 * Story overview: each thread a line, from left to right or top to bottom – either in story order
 * (rearranged by dragging, with sections like "Day 2") or in book order (by chapters). Scenes in
 * several threads are where lines merge.
 *
 * The layout always thinks of time as x and the threads as y; only drawing swaps them when
 * `vertical` is on, so dragging and sections work the same way in both directions.
 */
@Component({
  selector: 'wm-plot-page',
  imports: [Autofocus, Mascot, NgTemplateOutlet],
  templateUrl: './plot-page.html',
  styleUrls: ['./plot-page.scss', './plot-drawing.scss'],
  // Dragging rows: listen on the document – the dragged row moves in the DOM while dragging and
  // would lose a pointer capture.
  host: {
    '(document:pointermove)': 'onLanePointerMove($event)',
    '(document:pointerup)': 'onLanePointerUp()',
    '(document:pointercancel)': 'onLanePointerCancel()',
  },
})
export class PlotPage {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly api = inject(WortomatApi);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmDialog);
  private readonly injector = inject(Injector);
  private readonly error = inject(StatusMessages).channel();
  private readonly settings = inject(AppSettingsStore);
  private readonly drawing = viewChild<ElementRef<HTMLElement>>('drawing');

  protected readonly strandColor = strandColor;
  protected readonly statusInfo = statusInfo;
  protected readonly headerHeight = HEADER_HEIGHT;
  protected readonly nodeSize = NODE_SIZE;
  protected readonly padding = 22;

  /** Fresh on every visit to the page. */
  private readonly data = resource({
    loader: async () => {
      try {
        const [strands, relations, marks] = await Promise.all([
          this.api.listStrands(),
          this.api.sceneRelations(),
          this.api.storyMarks(),
        ]);
        this.marks.set(marks);
        return { strands, relations };
      } catch (error) {
        this.error.set(errorMessage(error, this.t()));
        throw error;
      }
    },
  });

  // View: remembered in the app settings so it stays the same when coming back
  private readonly plotView = computed(() => this.settings.settings().plotView);
  protected readonly order = computed(() => this.plotView().order);
  protected readonly onlyTurningPoints = computed(() => this.plotView().onlyTurningPoints);
  protected readonly compact = computed(() => this.plotView().compact);
  protected readonly vertical = computed(() => this.plotView().vertical);
  private readonly geometry = computed(() =>
    this.vertical()
      ? this.compact()
        ? PLOT_GEOMETRY.verticalCompact
        : PLOT_GEOMETRY.vertical
      : this.compact()
        ? PLOT_GEOMETRY.compact
        : PLOT_GEOMETRY.regular,
  );
  protected readonly laneHeight = computed(() => this.geometry().laneHeight);
  protected readonly columnWidth = computed(() => this.geometry().columnWidth);

  protected setView(changes: Partial<PlotViewSettings>): void {
    this.settings.setPlotView(changes);
  }

  protected readonly loaded = computed(() => this.data.hasValue());
  protected readonly laneDrag = signal<LaneDrag | null>(null);
  /** In their order – while dragging a row, already as they would land. */
  protected readonly strands = computed(() => {
    const strands = this.data.value()?.strands ?? [];
    const drag = this.laneDrag();
    if (!drag) return strands;
    const others = strands.filter((strand) => strand.id !== drag.strand.id);
    others.splice(drag.target, 0, drag.strand);
    return others;
  });
  private readonly marks = signal<StoryMark[]>([]);

  private readonly entries = computed((): PlotScene[] => {
    const strandIds = new Map(
      (this.data.value()?.relations ?? []).map((r) => [r.sceneId, r.strandIds]),
    );
    return scenesInOrder(this.store.tree()).map((entry, index) => ({
      ...entry,
      bookNumber: index + 1,
      strandIds: strandIds.get(entry.scene.id) ?? [],
    }));
  });
  private readonly byId = computed(
    () => new Map(this.entries().map((entry) => [entry.scene.id, entry])),
  );

  /** Over all scenes (including the ones currently hidden). */
  private readonly story = computed(() => storyColumns(this.entries().map(({ scene }) => scene)));
  private readonly storyIds = computed(() => this.story().map((column) => column.sceneIds));
  private readonly markAt = computed(() => marksByColumn(this.story(), this.marks()));
  /** Only then is there something to reset. */
  protected readonly arranged = computed(
    () => this.marks().length > 0 || this.entries().some(({ scene }) => scene.storyOrder !== null),
  );
  private readonly displaced = computed(() =>
    displacedScenes(
      this.storyIds(),
      new Map(this.entries().map((entry) => [entry.scene.id, entry.bookNumber])),
    ),
  );

  protected readonly sceneCount = computed(() => this.entries().length);
  protected readonly turningPointCount = computed(
    () => this.entries().filter((entry) => entry.scene.turningPoint).length,
  );

  /** The displayed columns and, per column, its index in the whole story. */
  private readonly view = computed(() => {
    const visible = (entry: PlotScene) => !this.onlyTurningPoints() || entry.scene.turningPoint;
    const columns: PlotColumnInput[] = [];
    const storyIndex: number[] = [];
    if (this.order() === 'book') {
      for (const entry of this.entries().filter(visible)) {
        const group = {
          id: entry.chapter.id,
          label: entry.chapter.title,
          number: entry.chapterNumber,
        };
        columns.push({ scenes: [entry], group });
      }
      return { columns, storyIndex };
    }
    let section = START_SECTION;
    this.story().forEach((column, index) => {
      const mark = this.markAt().get(index);
      if (mark) section = { id: mark.id, label: mark.label, number: null };
      const scenes = column.sceneIds.map((id) => this.byId().get(id)!).filter(visible);
      if (!scenes.length) return;
      columns.push({ scenes, group: section });
      storyIndex.push(index);
    });
    return { columns, storyIndex };
  });

  protected readonly layout = computed(() =>
    layoutPlot(this.view().columns, this.strands(), this.geometry()),
  );

  /** Shown in the info line. */
  protected readonly active = signal<PlotNode | null>(null);
  protected readonly drag = signal<Drag | null>(null);
  protected readonly markDraft = signal<MarkDraft | null>(null);

  protected isDisplaced(node: PlotNode): boolean {
    return this.displaced().has(node.scene.id);
  }

  /** In the whole story. */
  protected simultaneous(node: PlotNode): number {
    const column = this.storyIds().find((ids) => ids.includes(node.scene.id));
    return column ? column.length - 1 : 0;
  }

  protected open(node: PlotNode): void {
    void this.router.navigate(['/write/scene', node.scene.id]);
  }

  protected leave(node: PlotNode): void {
    if (this.active() === node) this.active.set(null);
  }

  // --- Drawing: from layout coordinates (time = x, threads = y) to the screen ---

  /** Size of the drawing on screen. */
  protected readonly size = computed(() => {
    const along = this.layout().width + this.padding;
    const across = this.layout().height;
    return this.vertical() ? { width: across, height: along } : { width: along, height: across };
  });

  private box(along: number, across: number, alongSize: number, acrossSize: number): Box {
    return this.vertical()
      ? { x: across, y: along, width: acrossSize, height: alongSize }
      : { x: along, y: across, width: alongSize, height: acrossSize };
  }

  protected nodeBox(node: PlotNode): Box {
    return this.box(node.x - NODE_SIZE / 2, node.y - node.height / 2, NODE_SIZE, node.height);
  }

  protected center(node: PlotNode): { x: number; y: number } {
    return this.vertical() ? { x: node.y, y: node.x } : { x: node.x, y: node.y };
  }

  protected bandBox(group: PlotGroup): Box {
    return this.box(group.x, 0, group.width, this.layout().height);
  }

  protected togetherBox(column: PlotColumn): Box {
    return this.box(column.left + 6, 4, column.width - 12, this.layout().height - 8);
  }

  /** The dotted line a thread runs along. */
  protected guideBox(lane: PlotLane): Box {
    return this.box(0, lane.y, this.layout().width + this.padding, 0);
  }

  /** "Insert here" line across all threads. */
  protected gapBox(at: number): Box {
    return this.box(at, 0, 0, this.layout().height);
  }

  protected linePathOf(line: PlotLine): string {
    return this.vertical() ? linePath(line.points, line.laneY, true) : line.path;
  }

  protected liftTransform(): string | null {
    const drag = this.drag();
    if (!drag?.moved) return null;
    return `translate${this.vertical() ? 'Y' : 'X'}(${drag.delta}px)`;
  }

  /** Position of something in the header (chapters, sections) along the time axis. */
  protected alongStyle(start: number, size?: number): Record<string, string> {
    const [position, extent] = this.vertical() ? ['top', 'height'] : ['left', 'width'];
    return size === undefined
      ? { [position]: `${start}px` }
      : { [position]: `${start}px`, [extent]: `${size}px` };
  }

  /** Pointer position along the time axis, or across it. */
  private alongOf(event: PointerEvent): number {
    return this.vertical() ? event.clientY : event.clientX;
  }

  private acrossOf(event: PointerEvent): number {
    return this.vertical() ? event.clientX : event.clientY;
  }

  protected onPointerDown(event: PointerEvent, node: PlotNode): void {
    if (event.button !== 0) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.drag.set({ node, start: this.alongOf(event), moved: false, delta: 0, hit: null });
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag || this.order() !== 'story') return;
    const delta = this.alongOf(event) - drag.start;
    if (!drag.moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return;
    const rect = this.drawing()?.nativeElement.getBoundingClientRect();
    const origin = (this.vertical() ? rect?.top : rect?.left) ?? 0;
    const hit = this.hitAt(this.alongOf(event) - origin, drag.node);
    this.drag.set({ ...drag, moved: true, delta, hit });
  }

  protected onPointerUp(): void {
    const drag = this.drag();
    this.drag.set(null);
    if (!drag) return;
    if (!drag.moved) {
      this.open(drag.node);
      return;
    }
    const target = drag.hit && this.dropTarget(drag.hit, drag.node.scene.id);
    if (target) void this.moveTo(drag.node.scene.id, target);
  }

  protected onPointerCancel(): void {
    this.drag.set(null);
  }

  private hitAt(x: number, node: PlotNode): Hit | null {
    const columns = this.layout().columns;
    const edge = this.columnWidth() * EDGE_SHARE;
    for (const [index, column] of columns.entries()) {
      if (x < column.left + edge) return { gap: index }; // also: the gap between two groups
      if (x <= column.left + column.width - edge) {
        return index === node.column ? null : { join: index };
      }
      if (x <= column.left + column.width) return { gap: index + 1 };
    }
    return { gap: columns.length };
  }

  /** Translates the displayed spot into a spot in the whole story. */
  private dropTarget(hit: Hit, sceneId: string): DropTarget | null {
    const columns = this.layout().columns;
    const other = (index: number) => columns[index]?.sceneIds.find((id) => id !== sceneId);
    if ('join' in hit) {
      const join = other(hit.join);
      return join ? { join } : null;
    }
    for (let index = hit.gap; index < columns.length; index++) {
      const before = other(index);
      if (before) return { before };
    }
    return { before: null };
  }

  /** Column the dragged scene would currently join as simultaneous. */
  protected readonly dropColumn = computed(() => {
    const hit = this.drag()?.hit;
    return hit && 'join' in hit ? hit.join : null;
  });

  /**
   * Position of the "insert here" line; never exactly 0 (it would be falsy in the template) –
   * before the first column it sits one pixel further right.
   */
  protected readonly dropGapX = computed(() => {
    const hit = this.drag()?.hit;
    return hit && 'gap' in hit ? Math.max(1, this.gapX(hit.gap)) : null;
  });

  private gapX(index: number): number {
    const columns = this.layout().columns;
    const next = columns[index];
    const previous = columns[index - 1];
    if (!previous) return next?.left ?? 0;
    if (!next) return previous.left + previous.width;
    return (previous.left + previous.width + next.left) / 2;
  }

  /** Arrow keys along the time axis (earlier, later) and across it (previous, next thread). */
  private arrows(): { earlier: string; later: string; up: string; down: string } {
    return this.vertical()
      ? { earlier: 'ArrowUp', later: 'ArrowDown', up: 'ArrowLeft', down: 'ArrowRight' }
      : { earlier: 'ArrowLeft', later: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' };
  }

  /** Enter opens; Alt + arrow along the time axis: the scene one column earlier or later. */
  protected onKeydown(event: KeyboardEvent, node: PlotNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(node);
      return;
    }
    if (!event.altKey || this.order() !== 'story') return;
    const { earlier, later } = this.arrows();
    if (event.key !== earlier && event.key !== later) return;
    event.preventDefault();
    // Simultaneous with others? Then first out of the column, before or after it.
    const alone = this.layout().columns[node.column]!.sceneIds.length === 1;
    const gap =
      event.key === earlier ? node.column - (alone ? 1 : 0) : node.column + (alone ? 2 : 1);
    if (gap < 0) return;
    const target = this.dropTarget({ gap }, node.scene.id);
    if (target) void this.moveTo(node.scene.id, target, true);
  }

  private async moveTo(sceneId: string, target: DropTarget, refocus = false): Promise<void> {
    const before = this.storyIds();
    const after = moveScene(before, sceneId, target);
    if (JSON.stringify(after) === JSON.stringify(before)) return;
    const marks = this.currentMarks().map((mark) => ({
      ...mark,
      beforeColumn: remapMark(before, after, mark.beforeColumn, sceneId),
    }));
    await this.save(after, marks);
    if (refocus) {
      afterNextRender(
        () => document.querySelector<SVGElement>(`.node[data-scene="${sceneId}"]`)?.focus(),
        { injector: this.injector },
      );
    }
  }

  protected onLanePointerDown(event: PointerEvent, strand: Strand): void {
    if (event.button !== 0) return;
    event.preventDefault(); // no text selection while dragging
    const index = this.strands().findIndex((s) => s.id === strand.id);
    const start = this.acrossOf(event) - index * this.laneHeight();
    this.laneDrag.set({ strand, start, target: index });
  }

  protected onLanePointerMove(event: PointerEvent): void {
    const drag = this.laneDrag();
    if (!drag) return;
    const last = (this.data.value()?.strands.length ?? 1) - 1;
    const target = Math.round((this.acrossOf(event) - drag.start) / this.laneHeight());
    const clamped = Math.max(0, Math.min(last, target));
    if (clamped !== drag.target) this.laneDrag.set({ ...drag, target: clamped });
  }

  protected async onLanePointerUp(): Promise<void> {
    const drag = this.laneDrag();
    if (!drag) return;
    await this.moveStrand(drag.strand, drag.target);
    this.laneDrag.set(null);
  }

  protected onLanePointerCancel(): void {
    this.laneDrag.set(null);
  }

  protected onLaneKeydown(event: KeyboardEvent, strand: Strand): void {
    const { up, down } = this.arrows();
    if (!event.altKey || (event.key !== up && event.key !== down)) return;
    event.preventDefault();
    const strands = this.data.value()?.strands ?? [];
    const index = strands.findIndex((s) => s.id === strand.id);
    const target = index + (event.key === up ? -1 : 1);
    if (target < 0 || target >= strands.length) return;
    void this.moveStrand(strand, target).then(() =>
      afterNextRender(
        () => document.querySelector<HTMLElement>(`.lanes [data-strand="${strand.id}"]`)?.focus(),
        { injector: this.injector },
      ),
    );
  }

  /** Only saves when something changed. */
  private async moveStrand(strand: Strand, target: number): Promise<void> {
    const strands = this.data.value()?.strands ?? [];
    const others = strands.filter((s) => s.id !== strand.id);
    if (strands[target]?.id === strand.id) return;
    this.error.set(null);
    try {
      const moved = await this.api.moveStrand(strand.id, others[target]?.id ?? null);
      this.data.update((data) => data && { ...data, strands: moved });
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  /** As they are saved. */
  private currentMarks(): Array<{ id: string; label: string; beforeColumn: number }> {
    return [...this.markAt()].map(([beforeColumn, mark]) => ({
      id: mark.id,
      label: mark.label,
      beforeColumn,
    }));
  }

  /** Columns before which "+" can start a section (where none starts yet). */
  protected readonly markSlots = computed(() => {
    if (this.order() !== 'story') return [];
    const { storyIndex } = this.view();
    return this.layout()
      .columns.map((column, index) => ({ x: column.left, beforeColumn: storyIndex[index]! }))
      .filter((slot) => !this.markAt().has(slot.beforeColumn));
  });

  protected startMark(beforeColumn: number, x: number): void {
    this.markDraft.set({ id: null, beforeColumn, x, label: '' });
  }

  protected editMark(groupId: string, x: number): void {
    const entry = [...this.markAt()].find(([, mark]) => mark.id === groupId);
    if (!entry) return;
    const [beforeColumn, mark] = entry;
    this.markDraft.set({ id: mark.id, beforeColumn, x, label: mark.label });
  }

  /** An empty name removes the section. */
  protected async saveMark(label: string): Promise<void> {
    const draft = this.markDraft();
    this.markDraft.set(null);
    if (!draft) return;
    const name = label.trim();
    if (!name && !draft.id) return;
    if (draft.id && name === draft.label) return;
    const marks = this.currentMarks().filter((mark) => mark.id !== draft.id);
    if (name) marks.push({ id: draft.id ?? '', label: name, beforeColumn: draft.beforeColumn });
    await this.save(this.storyIds(), marks);
  }

  protected async deleteMark(): Promise<void> {
    await this.saveMark('');
  }

  // --- Taking the story order over into the manuscript ---

  /** What would change; only in story order, and only when something differs from the book. */
  protected readonly plan = computed(() => {
    if (this.order() !== 'story') return null;
    const scenes = this.entries().map(({ scene, chapter }) => ({
      id: scene.id,
      chapterId: chapter.id,
    }));
    const plan = manuscriptPlan(this.storyIds(), scenes);
    return plan.moves.length ? plan : null;
  });
  protected readonly planOpen = signal(false);
  protected readonly applying = signal(false);
  /** Put a todo "moved" in front of each moved scene, to find them in the manuscript. */
  protected readonly markMoved = signal(true);
  /** Feedback until the next change. */
  protected readonly applied = signal<{ count: number; marked: boolean } | null>(null);

  protected titleOf(sceneId: string): string {
    return this.byId().get(sceneId)?.scene.title ?? '';
  }

  protected describeMove(move: ManuscriptMove): string {
    const t = this.t();
    const chapter = (id: string) => {
      const entry = this.entries().find((e) => e.chapter.id === id)!;
      return t.plot.chapterNamed(entry.chapterNumber, entry.chapter.title);
    };
    const to = chapter(move.toChapterId);
    const where = move.afterId
      ? t.plot.moveAfter(to, this.titleOf(move.afterId))
      : t.plot.moveToStart(to);
    return move.fromChapterId === move.toChapterId
      ? where
      : t.plot.moveFrom(chapter(move.fromChapterId), where);
  }

  protected async applyPlan(): Promise<void> {
    const plan = this.plan();
    if (!plan || this.applying()) return;
    this.applying.set(true);
    try {
      // Fix every scene's place in the story first: scenes never placed follow the scene before
      // them in the book, and that is about to change.
      if (!(await this.save(this.storyIds(), this.currentMarks()))) return;
      const marked = this.markMoved();
      await this.store.arrangeScenes({
        chapters: plan.chapters,
        ...(marked && {
          markMoved: {
            sceneIds: plan.moves.map((move) => move.sceneId),
            label: this.t().plot.movedLabel,
          },
        }),
      });
      this.planOpen.set(false);
      this.applied.set({ count: plan.moves.length, marked });
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    } finally {
      this.applying.set(false);
    }
  }

  protected async reset(): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.plot.resetTitle,
      message: t.plot.resetMessage,
      confirmLabel: t.plot.resetConfirm,
    });
    if (confirmed) await this.save([], []);
  }

  /** `false` if it failed (the message is shown already). */
  private async save(
    columns: string[][],
    marks: Array<{ id: string; label: string; beforeColumn: number }>,
  ): Promise<boolean> {
    this.error.set(null);
    this.applied.set(null);
    try {
      this.marks.set(
        await this.store.saveStory({
          columns,
          marks: marks.map(({ id, ...mark }) => (id ? { id, ...mark } : mark)),
        }),
      );
      return true;
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
      return false;
    }
  }

  /**
   * Just below the node, or beside it when vertical (the diamond reaches a little further). As
   * HTML on top of the SVG, so long titles wrap and get truncated.
   */
  protected labelStyle(node: PlotNode): Record<string, string> {
    const { x, y } = this.center(node);
    const column = this.columnWidth();
    if (this.vertical()) {
      const left = x + this.reach(node) + 4;
      const width = this.geometry().labelReach - 6;
      return {
        left: `${left}px`,
        top: `${y - column / 2}px`,
        width: `${width}px`,
        height: `${column}px`,
      };
    }
    return {
      left: `${x - column / 2}px`,
      top: `${y + this.reach(node) + 3}px`,
      width: `${column}px`,
    };
  }

  /** Half the node's extent across the time axis. */
  protected reach(node: PlotNode): number {
    return this.isDiamond(node) ? DIAMOND_RADIUS : node.height / 2;
  }

  /** Top right of the node: past its far edge across the time axis. */
  protected displacedAt(node: PlotNode): { x: number; y: number } {
    const { x, y } = this.center(node);
    return this.vertical()
      ? { x: x + this.reach(node), y: y - NODE_SIZE / 2 }
      : { x: x + NODE_SIZE / 2, y: y - this.reach(node) };
  }

  protected isDiamond(node: PlotNode): boolean {
    return !!node.scene.turningPoint && node.strands.length < 2;
  }

  protected diamond(node: PlotNode): string {
    const r = DIAMOND_RADIUS;
    const { x, y } = this.center(node);
    return `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
  }
}
