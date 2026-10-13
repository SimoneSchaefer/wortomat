import { Component, computed, inject, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { statusInfo } from '../../core/scene-status';
import { StatusMessages } from '../../core/status-messages';
import { strandColor } from '../../core/strands';
import { WortomatApi } from '../../core/wortomat-api';
import { scenesInOrder } from '../stats/stats';
import { COLUMN_WIDTH, LANE_HEIGHT, layoutPlot, NODE_SIZE, type PlotNode } from './plot-layout';

/** Halbe Diagonale der Raute – etwas größer als ein Kreis, damit sie gleich viel Fläche hat. */
const DIAMOND_RADIUS = NODE_SIZE * 0.68;

/** Kopfzeile mit den Kapiteln über der Zeichnung. */
const HEADER_HEIGHT = 28;

/**
 * Übersicht der Handlung: jeder Strang eine Linie durchs Buch, von links nach rechts in
 * Buchreihenfolge. Szenen in mehreren Strängen sind die Stellen, an denen Linien zusammenlaufen.
 */
@Component({
  selector: 'wm-plot-page',
  templateUrl: './plot-page.html',
  styleUrl: './plot-page.scss',
})
export class PlotPage {
  protected readonly t = inject(I18n).t;
  private readonly store = inject(ProjectStore);
  private readonly api = inject(WortomatApi);
  private readonly router = inject(Router);
  private readonly error = inject(StatusMessages).channel();

  protected readonly strandColor = strandColor;
  protected readonly statusInfo = statusInfo;
  protected readonly headerHeight = HEADER_HEIGHT;
  protected readonly laneHeight = LANE_HEIGHT;
  protected readonly nodeSize = NODE_SIZE;
  protected readonly columnWidth = COLUMN_WIDTH;
  /** Platz rechts neben der letzten Spalte. */
  protected readonly padding = 22;

  /** Stränge und Zuordnungen – bei jedem Öffnen der Seite frisch. */
  private readonly data = resource({
    loader: async () => {
      try {
        const [strands, relations] = await Promise.all([
          this.api.listStrands(),
          this.api.sceneRelations(),
        ]);
        return { strands, relations };
      } catch (error) {
        this.error.set(errorMessage(error, this.t()));
        throw error;
      }
    },
  });

  protected readonly onlyTurningPoints = signal(true);
  protected readonly loaded = computed(() => this.data.hasValue());
  protected readonly strands = computed(() => this.data.value()?.strands ?? []);

  private readonly scenes = computed(() => {
    const strandIds = new Map(
      (this.data.value()?.relations ?? []).map((r) => [r.sceneId, r.strandIds]),
    );
    return scenesInOrder(this.store.tree()).map((entry) => ({
      ...entry,
      strandIds: strandIds.get(entry.scene.id) ?? [],
    }));
  });

  protected readonly sceneCount = computed(() => this.scenes().length);
  protected readonly turningPointCount = computed(
    () => this.scenes().filter((entry) => entry.scene.turningPoint).length,
  );

  protected readonly layout = computed(() =>
    layoutPlot(this.scenes(), this.strands(), this.onlyTurningPoints()),
  );

  /** Szene unter dem Mauszeiger bzw. mit dem Fokus – erscheint in der Infozeile. */
  protected readonly active = signal<PlotNode | null>(null);

  protected open(node: PlotNode): void {
    void this.router.navigate(['/write/scene', node.scene.id]);
  }

  protected onKeydown(event: KeyboardEvent, node: PlotNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open(node);
    }
  }

  protected leave(node: PlotNode): void {
    if (this.active() === node) this.active.set(null);
  }

  /** Oberkante des Titels: knapp unter dem Knoten (die Raute ragt etwas weiter hinaus). */
  protected labelTop(node: PlotNode): number {
    const reach =
      node.scene.turningPoint && node.strands.length < 2 ? DIAMOND_RADIUS : node.height / 2;
    return node.y + reach + 3;
  }

  /** Raute für Wendepunkte. */
  protected diamond(node: PlotNode): string {
    const r = DIAMOND_RADIUS;
    return `${node.x},${node.y - r} ${node.x + r},${node.y} ${node.x},${node.y + r} ${node.x - r},${node.y}`;
  }
}
