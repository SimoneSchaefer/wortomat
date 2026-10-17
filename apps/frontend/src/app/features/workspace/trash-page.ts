import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { TrashEntry } from '@wortomat/shared';
import { ConfirmDialog } from '../../core/confirm-dialog';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore } from '../../core/project-store';
import { relativeTime } from '../../core/relative-time';
import { StatusMessages } from '../../core/status-messages';

@Component({
  selector: 'wm-trash-page',
  templateUrl: './trash-page.html',
  styleUrl: './trash-page.scss',
})
export class TrashPage {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly store = inject(ProjectStore);
  private readonly confirm = inject(ConfirmDialog);
  private readonly error = inject(StatusMessages).channel();

  /** What the last restore did – parts and chapters only show in the tree, so say so here. */
  protected readonly notice = signal<string | null>(null);

  protected deletedAt(entry: TrashEntry): string {
    return this.t().trash.deletedAt(relativeTime(entry.deletedAt, this.i18n.language()));
  }

  protected exactTime(entry: TrashEntry): string {
    return new Date(entry.deletedAt).toLocaleString(this.i18n.language());
  }

  protected async restore(entry: TrashEntry): Promise<void> {
    await this.run(async () => {
      const result = await this.store.restoreFromTrash(entry.id);
      const t = this.t().trash;
      this.notice.set(
        result.atOldPlace ? t.restored(entry.title) : t.restoredElsewhere(entry.title),
      );
      if (entry.kind === 'scene' && result.atOldPlace) {
        await this.router.navigate(['/write/scene', entry.id]);
      }
    });
  }

  protected async deleteForGood(entry: TrashEntry): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.trash.deleteForGoodTitle,
      message: t.trash.deleteForGoodMessage(entry.title),
      confirmLabel: t.trash.deleteForGood,
    });
    if (confirmed) await this.run(() => this.store.deleteFromTrash(entry.id));
  }

  protected async emptyTrash(): Promise<void> {
    const t = this.t();
    const confirmed = await this.confirm.ask({
      title: t.trash.emptyTrashTitle,
      message: t.trash.emptyTrashMessage(this.store.trash().length),
      confirmLabel: t.trash.emptyTrash,
    });
    if (confirmed) await this.run(() => this.store.emptyTrash());
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.error.set(null);
    this.notice.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(errorMessage(error, this.t()));
    }
  }
}
