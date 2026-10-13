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
import { ProjectStore } from '../../core/project-store';
import { statusInfo } from '../../core/scene-status';
import { StatusMessages } from '../../core/status-messages';
import { strandColor } from '../../core/strands';
import { WortomatApi } from '../../core/wortomat-api';
import { scenesInOrder } from '../stats/stats';
import {
  layoutPlot,
  NODE_SIZE,
  PLOT_GEOMETRY,
  type PlotColumnInput,
  type PlotGroupInfo,
  type PlotNode,
  type PlotScene,
} from './plot-layout';
import {
  displacedScenes,
  type DropTarget,
  marksByColumn,
  moveScene,
  remapMark,
  storyColumns,
} from './story-order';

/** Halbe Diagonale der Raute – etwas größer als ein Kreis, damit sie gleich viel Fläche hat. */
const DIAMOND_RADIUS = NODE_SIZE * 0.68;

/** Kopfzeile mit Kapiteln bzw. Abschnitten über der Zeichnung. */
const HEADER_HEIGHT = 30;

/** Ab dieser Strecke wird aus einem Klick ein Ziehen. */
const DRAG_THRESHOLD_PX = 4;

/** So weit vom Spaltenrand (Anteil einer Spalte) gilt Ablegen als „davor/dahinter“. */
const EDGE_SHARE = 0.25;

/** Wo eine gezogene Szene landen würde – bezogen auf die angezeigten Spalten. */
type Hit = { join: number } | { gap: number };

/** Ein Strang, dessen Zeile gerade nach oben oder unten gezogen wird. */
interface LaneDrag {
  strand: Strand;
  startY: number;
  /** Index der Zeile, an der er beim Loslassen landen würde. */
  target: number;
}

interface Drag {
  node: PlotNode;
  startX: number;
  moved: boolean;
  dx: number;
  hit: Hit | null;
}

/** Abschnittsmarke, die gerade benannt wird. */
interface MarkDraft {
  /** `null` = neue Marke */
  id: string | null;
  /** Vor dieser Spalte der Handlung (alle Szenen, nicht nur die angezeigten). */
  beforeColumn: number;
  x: number;
  label: string;
}

const START_SECTION: PlotGroupInfo = { id: 'start', label: '', number: null };

/**
 * Übersicht der Handlung: jeder Strang eine Linie, von links nach rechts – entweder in der
 * Reihenfolge der Handlung (umzuordnen per Ziehen, mit Abschnitten wie „Tag 2“) oder in der
 * des Buchs (nach Kapiteln). Szenen in mehreren Strängen sind die Stellen, an denen Linien
 * zusammenlaufen.
 */
@Component({
  selector: 'wm-plot-page',
  imports: [Autofocus],
  templateUrl: './plot-page.html',
  styleUrls: ['./plot-page.scss', './plot-drawing.scss'],
  // Zeilen ziehen: am Dokument lauschen – die gezogene Zeile wandert beim Ziehen im DOM mit
  // und verlöre dabei einen Pointer-Capture.
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
  /** Platz rechts neben der letzten Spalte. */
  protected readonly padding = 22;

  /** Stränge, Zuordnungen und Abschnitte – bei jedem Öffnen der Seite frisch. */
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

  // Ansicht: in den App-Einstellungen gemerkt, damit sie beim Zurückkommen gleich bleibt
  private readonly plotView = computed(() => this.settings.settings().plotView);
  protected readonly order = computed(() => this.plotView().order);
  protected readonly onlyTurningPoints = computed(() => this.plotView().onlyTurningPoints);
  protected readonly compact = computed(() => this.plotView().compact);
  private readonly geometry = computed(() =>
    this.compact() ? PLOT_GEOMETRY.compact : PLOT_GEOMETRY.regular,
  );
  protected readonly laneHeight = computed(() => this.geometry().laneHeight);
  protected readonly columnWidth = computed(() => this.geometry().columnWidth);

  protected setView(changes: Partial<PlotViewSettings>): void {
    this.settings.setPlotView(changes);
  }

  protected readonly loaded = computed(() => this.data.hasValue());
  protected readonly laneDrag = signal<LaneDrag | null>(null);
  /** Stränge in ihrer Reihenfolge – beim Ziehen einer Zeile schon so, wie sie landen würde. */
  protected readonly strands = computed(() => {
    const strands = this.data.value()?.strands ?? [];
    const drag = this.laneDrag();
    if (!drag) return strands;
    const others = strands.filter((strand) => strand.id !== drag.strand.id);
    others.splice(drag.target, 0, drag.strand);
    return others;
  });
  private readonly marks = signal<StoryMark[]>([]);

  /** Alle Szenen in Buchreihenfolge. */
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

  /** Reihenfolge der Handlung über alle Szenen (auch die gerade ausgeblendeten). */
  private readonly story = computed(() => storyColumns(this.entries().map(({ scene }) => scene)));
  private readonly storyIds = computed(() => this.story().map((column) => column.sceneIds));
  private readonly markAt = computed(() => marksByColumn(this.story(), this.marks()));
  /** Wurde schon etwas geordnet? Dann gibt es etwas zurückzusetzen. */
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

  /** Die angezeigten Spalten und, je Spalte, ihr Index in der ganzen Handlung. */
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

  /** Szene unter dem Mauszeiger bzw. mit dem Fokus – erscheint in der Infozeile. */
  protected readonly active = signal<PlotNode | null>(null);
  protected readonly drag = signal<Drag | null>(null);
  protected readonly markDraft = signal<MarkDraft | null>(null);

  protected isDisplaced(node: PlotNode): boolean {
    return this.displaced().has(node.scene.id);
  }

  /** Wie viele Szenen passieren gleichzeitig mit dieser (in der ganzen Handlung)? */
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

  // Ziehen ------------------------------------------------------------------

  protected onPointerDown(event: PointerEvent, node: PlotNode): void {
    if (event.button !== 0) return;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
    this.drag.set({ node, startX: event.clientX, moved: false, dx: 0, hit: null });
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag();
    if (!drag || this.order() !== 'story') return;
    const dx = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX) return;
    const left = this.drawing()?.nativeElement.getBoundingClientRect().left ?? 0;
    this.drag.set({ ...drag, moved: true, dx, hit: this.hitAt(event.clientX - left, drag.node) });
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

  /** Welche Spalte bzw. Lücke liegt an dieser Stelle der Zeichnung? */
  private hitAt(x: number, node: PlotNode): Hit | null {
    const columns = this.layout().columns;
    const edge = this.columnWidth() * EDGE_SHARE;
    for (const [index, column] of columns.entries()) {
      if (x < column.left + edge) return { gap: index }; // auch: Lücke zwischen zwei Gruppen
      if (x <= column.left + column.width - edge) {
        return index === node.column ? null : { join: index };
      }
      if (x <= column.left + column.width) return { gap: index + 1 };
    }
    return { gap: columns.length };
  }

  /** Übersetzt die angezeigte Stelle in eine Stelle der ganzen Handlung. */
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

  /** Spalte, in die die gezogene Szene gerade „gleichzeitig“ fallen würde. */
  protected readonly dropColumn = computed(() => {
    const hit = this.drag()?.hit;
    return hit && 'join' in hit ? hit.join : null;
  });

  /**
   * Wo der Strich für „hier einfügen“ steht; nie genau 0 (sonst wäre er im Template falsy) –
   * vor der ersten Spalte liegt er einen Pixel weiter rechts.
   */
  protected readonly dropGapX = computed(() => {
    const hit = this.drag()?.hit;
    return hit && 'gap' in hit ? Math.max(1, this.gapX(hit.gap)) : null;
  });

  /** Strichposition für die Lücke vor Spalte `index`. */
  private gapX(index: number): number {
    const columns = this.layout().columns;
    const next = columns[index];
    const previous = columns[index - 1];
    if (!previous) return next?.left ?? 0;
    if (!next) return previous.left + previous.width;
    return (previous.left + previous.width + next.left) / 2;
  }

  /** Enter öffnet; Alt + Pfeil links/rechts: die Szene eine Spalte früher bzw. später. */
  protected onKeydown(event: KeyboardEvent, node: PlotNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(node);
      return;
    }
    if (!event.altKey || this.order() !== 'story') return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    // Mit anderen gleichzeitig? Dann erst aus der Spalte heraus, davor bzw. dahinter.
    const alone = this.layout().columns[node.column]!.sceneIds.length === 1;
    const gap =
      event.key === 'ArrowLeft' ? node.column - (alone ? 1 : 0) : node.column + (alone ? 2 : 1);
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

  // Zeilen der Stränge umsortieren ------------------------------------------

  protected onLanePointerDown(event: PointerEvent, strand: Strand): void {
    if (event.button !== 0) return;
    event.preventDefault(); // kein Markieren von Text beim Ziehen
    const index = this.strands().findIndex((s) => s.id === strand.id);
    this.laneDrag.set({ strand, startY: event.clientY - index * this.laneHeight(), target: index });
  }

  protected onLanePointerMove(event: PointerEvent): void {
    const drag = this.laneDrag();
    if (!drag) return;
    const last = (this.data.value()?.strands.length ?? 1) - 1;
    const target = Math.round((event.clientY - drag.startY) / this.laneHeight());
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

  /** Alt + Pfeil hoch/runter verschiebt die Zeile des Strangs. */
  protected onLaneKeydown(event: KeyboardEvent, strand: Strand): void {
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const strands = this.data.value()?.strands ?? [];
    const index = strands.findIndex((s) => s.id === strand.id);
    const target = index + (event.key === 'ArrowUp' ? -1 : 1);
    if (target < 0 || target >= strands.length) return;
    void this.moveStrand(strand, target).then(() =>
      afterNextRender(
        () => document.querySelector<HTMLElement>(`.lanes [data-strand="${strand.id}"]`)?.focus(),
        { injector: this.injector },
      ),
    );
  }

  /** Speichert die neue Reihenfolge, wenn sich etwas geändert hat. */
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

  // Abschnitte --------------------------------------------------------------

  /** Die Marken mit der Spalte, vor der sie stehen – so, wie sie gespeichert werden. */
  private currentMarks(): Array<{ id: string; label: string; beforeColumn: number }> {
    return [...this.markAt()].map(([beforeColumn, mark]) => ({
      id: mark.id,
      label: mark.label,
      beforeColumn,
    }));
  }

  /** Spalten, vor denen „+“ einen Abschnitt beginnen kann (dort beginnt noch keiner). */
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

  /** Speichert den Namen; ein leerer Name entfernt den Abschnitt. */
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

  protected async reset(): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.plot.resetTitle,
      message: t.plot.resetMessage,
      confirmLabel: t.plot.resetConfirm,
    });
    if (confirmed) await this.save([], []);
  }

  private async save(
    columns: string[][],
    marks: Array<{ id: string; label: string; beforeColumn: number }>,
  ): Promise<void> {
    this.error.set(null);
    try {
      this.marks.set(
        await this.store.saveStory({
          columns,
          marks: marks.map(({ id, ...mark }) => (id ? { id, ...mark } : mark)),
        }),
      );
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }

  // Zeichnen ----------------------------------------------------------------

  /** Oberkante des Titels: knapp unter dem Knoten (die Raute ragt etwas weiter hinaus). */
  protected labelTop(node: PlotNode): number {
    return node.y + this.reach(node) + 3;
  }

  /** Wie weit der Knoten von seiner Mitte nach oben bzw. unten reicht. */
  protected reach(node: PlotNode): number {
    return this.isDiamond(node) ? DIAMOND_RADIUS : node.height / 2;
  }

  protected isDiamond(node: PlotNode): boolean {
    return !!node.scene.turningPoint && node.strands.length < 2;
  }

  /** Raute für Wendepunkte. */
  protected diamond(node: PlotNode): string {
    const r = DIAMOND_RADIUS;
    return `${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`;
  }
}
