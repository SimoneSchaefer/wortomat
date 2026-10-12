import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import type { SearchHit } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { ManuscriptTree } from './manuscript-tree';

const SEARCH_DELAY_MS = 250;

@Component({
  selector: 'wm-workspace-page',
  imports: [RouterOutlet, RouterLink, DecimalPipe, ManuscriptTree],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
})
export class WorkspacePage {
  private readonly api = inject(WortomatApi);
  private readonly router = inject(Router);
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly store = inject(ProjectStore);

  protected readonly query = signal('');
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly error = signal<string | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected onSearchInput(value: string): void {
    this.query.set(value);
    clearTimeout(this.searchTimer);
    if (!value.trim()) {
      this.hits.set([]);
      return;
    }
    this.searchTimer = setTimeout(async () => {
      try {
        const hits = await this.api.search(value);
        // Nur übernehmen, wenn die Eingabe sich inzwischen nicht geändert hat.
        if (this.query() === value) this.hits.set(hits);
      } catch (error) {
        this.error.set(errorMessage(error));
      }
    }, SEARCH_DELAY_MS);
  }

  protected clearSearch(): void {
    this.onSearchInput('');
  }

  protected async closeProject(): Promise<void> {
    try {
      await this.pendingSaves.flushAll();
      await this.store.close();
      await this.router.navigate(['/']);
    } catch (error) {
      this.error.set(errorMessage(error));
    }
  }
}
