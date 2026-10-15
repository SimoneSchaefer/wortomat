import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { ManuscriptNode, NodeKind } from '@wortomat/shared';
import { AnnotationBadges } from '../../core/annotation-badges';
import { Autofocus } from '../../core/autofocus';
import { addCounts, ANNOTATION_KINDS, NO_ANNOTATIONS } from '../../core/annotations';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { statusInfo } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { ProjectStore } from '../../core/project-store';
import {
  changesPosition,
  type DropPlan,
  type DropPosition,
  planDrop,
  planRootDrop,
} from './drop-plan';
import { SceneFilter } from './scene-filter';
import { StatusMessages } from '../../core/status-messages';
import { ConfirmDialog } from '../../core/confirm-dialog';

/** A data type of its own so drags from outside (e.g. files) do not trigger the tree. */
const DRAG_TYPE = 'application/x-wortomat-node';

@Component({
  selector: 'wm-manuscript-tree',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    AnnotationBadges,
    Autofocus,
    StatusIcon,
  ],
  templateUrl: './manuscript-tree.html',
  styleUrl: './manuscript-tree.scss',
  host: { '[style.--count-chars]': 'countChars()' },
})
export class ManuscriptTree {
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;
  protected readonly store = inject(ProjectStore);
  protected readonly filter = inject(SceneFilter);

  protected readonly editingId = signal<string | null>(null);
  private readonly error = inject(StatusMessages).channel();
  private readonly confirm = inject(ConfirmDialog);

  protected readonly draggingId = signal<string | null>(null);
  protected readonly dropPlan = signal<DropPlan | null>(null);

  /** Also called from the sidebar header (new chapter/part). */
  async add(kind: NodeKind, parentId: string | null): Promise<void> {
    if (parentId) this.store.reveal(parentId); // new entries should be visible
    await this.run(async () => {
      const title = this.t().tree.newTitle[kind];
      const node = await this.store.addNode({ kind, parentId, title });
      if (node.kind === 'scene') {
        // Renaming happens on the scene page, which selects the new title right away.
        await this.router.navigate(['/write/scene', node.id]);
      } else {
        this.editingId.set(node.id);
      }
    });
  }

  protected async rename(node: ManuscriptNode, title: string): Promise<void> {
    if (this.editingId() !== node.id) return;
    this.editingId.set(null);
    const trimmed = title.trim();
    if (trimmed && trimmed !== node.title) {
      await this.run(() => this.store.renameNode(node.id, trimmed));
    }
  }

  protected async remove(node: ManuscriptNode): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.tree.deleteTitle[node.kind],
      message:
        node.kind === 'scene' ? t.tree.deleteScene(node.title) : t.tree.deleteContainer(node.title),
      confirmLabel: t.confirm.delete,
    });
    if (!confirmed) return;
    await this.run(async () => {
      await this.store.deleteNode(node.id);
      if (
        this.router.url.startsWith('/write/scene/') &&
        !this.store.findNode(this.router.url.split('/').pop()!)
      ) {
        await this.router.navigate(['/write']);
      }
    });
  }

  /**
   * Kinds that occur anywhere in the book. Each gets a fixed column in every row – even where it is
   * missing – so the counts line up.
   */
  protected readonly annotationKinds = computed(() => {
    const total = this.filter
      .tree()
      .reduce((sum, item) => addCounts(sum, item.annotations), NO_ANNOTATIONS);
    return ANNOTATION_KINDS.filter((info) => total[info.kind] > 0);
  });

  protected readonly noAnnotations = NO_ANNOTATIONS;

  /**
   * Characters of the longest word count – the column gets this wide so it lines up without wasting
   * space. The largest number is always at the top: parts and chapters show the sum.
   */
  protected readonly countChars = computed(() => {
    const max = Math.max(0, ...this.filter.tree().map((item) => item.wordCount));
    return this.t().number(max).length;
  });

  /** While filtering, all parts and chapters are open – otherwise hits would be hidden. */
  protected isCollapsed(id: string): boolean {
    return !this.filter.active() && this.store.collapsed().has(id);
  }

  protected status(node: ManuscriptNode) {
    return statusInfo(node.status ?? 'idea');
  }

  protected onDragStart(event: DragEvent, node: ManuscriptNode): void {
    if (!event.dataTransfer) return;
    event.stopPropagation(); // otherwise the parent element would be dragged along
    event.dataTransfer.setData(DRAG_TYPE, node.id);
    event.dataTransfer.effectAllowed = 'move';
    this.draggingId.set(node.id);
  }

  protected onDragOverItem(event: DragEvent, target: ManuscriptNode): void {
    const dragged = this.draggedNode(event);
    if (!dragged) return;
    event.stopPropagation(); // do not count it as a drop onto the free area
    const row = event.currentTarget as HTMLElement;
    const { top, height } = row.getBoundingClientRect();
    const ratio = height > 0 ? (event.clientY - top) / height : 0.5;
    this.acceptDrop(event, planDrop(dragged, target, ratio, this.store.nodes()));
  }

  protected onDragOverFreeSpace(event: DragEvent): void {
    const dragged = this.draggedNode(event);
    if (dragged) {
      this.acceptDrop(event, planRootDrop(dragged));
    }
  }

  protected onDragLeave(event: DragEvent): void {
    const tree = event.currentTarget as HTMLElement;
    if (!tree.contains(event.relatedTarget as Node | null)) {
      this.dropPlan.set(null);
    }
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    const dragged = this.draggedNode(event);
    const plan = this.dropPlan();
    this.onDragEnd();
    if (!dragged || !plan) return;
    event.preventDefault();
    if (changesPosition(dragged, plan, this.store.nodes())) {
      await this.run(() => this.store.moveNode(dragged.id, plan.request));
    }
  }

  protected onDragEnd(): void {
    this.draggingId.set(null);
    this.dropPlan.set(null);
  }

  /** For `data-drop`. */
  protected dropMarker(id: string | null): DropPosition | null {
    const plan = this.dropPlan();
    return plan && plan.targetId === id ? plan.position : null;
  }

  private draggedNode(event: DragEvent): ManuscriptNode | undefined {
    const id = this.draggingId();
    return id && event.dataTransfer?.types.includes(DRAG_TYPE)
      ? this.store.findNode(id)
      : undefined;
  }

  private acceptDrop(event: DragEvent, plan: DropPlan | null): void {
    this.dropPlan.set(plan);
    if (plan && event.dataTransfer) {
      event.preventDefault(); // tells the browser that dropping is allowed here
      event.dataTransfer.dropEffect = 'move';
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
