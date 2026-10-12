import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { ManuscriptNode, NodeKind } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { ANNOTATION_KINDS } from '../../core/annotations';
import { errorMessage } from '../../core/errors';
import { statusInfo } from '../../core/scene-status';
import { ProjectStore } from '../../core/project-store';
import {
  changesPosition,
  type DropPlan,
  type DropPosition,
  planDrop,
  planRootDrop,
} from './drop-plan';

/** Eigener Datentyp, damit Drags von außen (z. B. Dateien) den Baum nicht auslösen. */
const DRAG_TYPE = 'application/x-wortomat-node';

const DEFAULT_TITLES: Record<NodeKind, string> = {
  part: 'Neuer Teil',
  chapter: 'Neues Kapitel',
  scene: 'Neue Szene',
};

@Component({
  selector: 'wm-manuscript-tree',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, Autofocus],
  templateUrl: './manuscript-tree.html',
  styleUrl: './manuscript-tree.scss',
})
export class ManuscriptTree {
  private readonly router = inject(Router);
  protected readonly store = inject(ProjectStore);

  /** ID des Elements, dessen Titel gerade bearbeitet wird. */
  protected readonly editingId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  /** Gerade gezogenes Element und wohin es beim Loslassen käme. */
  protected readonly draggingId = signal<string | null>(null);
  protected readonly dropPlan = signal<DropPlan | null>(null);

  protected async add(kind: NodeKind, parentId: string | null): Promise<void> {
    await this.run(async () => {
      const node = await this.store.addNode({ kind, parentId, title: DEFAULT_TITLES[kind] });
      this.editingId.set(node.id);
      if (node.kind === 'scene') {
        await this.router.navigate(['/write/scene', node.id]);
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
    const what =
      node.kind === 'scene' ? 'die Szene' : `„${node.title}“ mit allen enthaltenen Szenen`;
    if (!confirm(`Möchtest du ${what} wirklich löschen?`)) return;
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

  protected readonly annotationKinds = ANNOTATION_KINDS;

  protected status(node: ManuscriptNode) {
    return statusInfo(node.status ?? 'idea');
  }

  // Drag & Drop --------------------------------------------------------------

  protected onDragStart(event: DragEvent, node: ManuscriptNode): void {
    if (!event.dataTransfer) return;
    event.stopPropagation(); // sonst würde auch das Eltern-Element mitgezogen
    event.dataTransfer.setData(DRAG_TYPE, node.id);
    event.dataTransfer.effectAllowed = 'move';
    this.draggingId.set(node.id);
  }

  protected onDragOverItem(event: DragEvent, target: ManuscriptNode): void {
    const dragged = this.draggedNode(event);
    if (!dragged) return;
    event.stopPropagation(); // nicht als Drop auf die freie Fläche werten
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

  /** Wo am Element `id` der Einfügemarker angezeigt wird (für `data-drop`). */
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
      event.preventDefault(); // signalisiert dem Browser: hier darf abgelegt werden
      event.dataTransfer.dropEffect = 'move';
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
