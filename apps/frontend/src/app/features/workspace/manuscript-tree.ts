import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import type { ManuscriptNode, NodeKind } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { errorMessage } from '../../core/errors';
import { ProjectStore } from '../../core/project-store';

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

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
