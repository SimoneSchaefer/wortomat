import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import type { NoteKind, SearchHit } from '@wortomat/shared';
import { filter, map } from 'rxjs';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { NOTE_KIND_LIST, NOTE_KINDS } from '../notes/note-kinds';
import { NoteList } from '../notes/note-list';
import { NotesStore } from '../notes/notes-store';
import { ManuscriptTree } from './manuscript-tree';

const SEARCH_DELAY_MS = 250;

type Section = 'manuscript' | NoteKind;

interface MenuItem {
  section: Section;
  label: string;
  /** Wohin der Menüpunkt führt, solange dort noch nichts geöffnet war. */
  url: string;
}

const MENU: readonly MenuItem[] = [
  { section: 'manuscript', label: 'Manuskript', url: '/write' },
  ...NOTE_KIND_LIST.map((config) => ({
    section: config.kind,
    label: config.label,
    url: `/write/${config.path}`,
  })),
];

@Component({
  selector: 'wm-workspace-page',
  imports: [RouterOutlet, RouterLink, DecimalPipe, ManuscriptTree, NoteList],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  // Pro geöffnetem Projekt frisch – die Notizen gehören zum Projekt.
  providers: [NotesStore],
})
export class WorkspacePage {
  private readonly api = inject(WortomatApi);
  private readonly router = inject(Router);
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly store = inject(ProjectStore);
  protected readonly notes = inject(NotesStore);

  protected readonly menu = MENU;
  protected readonly query = signal('');
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly error = signal<string | null>(null);
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly section = computed(() => sectionOf(this.url()));
  protected readonly noteKind = computed(() => {
    const section = this.section();
    return section === 'manuscript' ? null : section;
  });
  /** Zuletzt geöffnete Seite je Bereich, damit man beim Zurückwechseln dort weitermacht. */
  private readonly lastUrls = new Map<Section, string>();

  constructor() {
    effect(() => this.lastUrls.set(this.section(), this.url()));
    this.notes.load().catch((error: unknown) => this.error.set(errorMessage(error)));
  }

  protected openSection(item: MenuItem): void {
    this.clearSearch();
    if (item.section !== this.section()) {
      void this.router.navigateByUrl(this.lastUrls.get(item.section) ?? item.url);
    }
  }

  protected hitLink(hit: SearchHit): string[] {
    return hit.kind === 'scene'
      ? ['/write/scene', hit.id]
      : ['/write', NOTE_KINDS[hit.kind].path, hit.id];
  }

  protected hitLabel(hit: SearchHit): string {
    return hit.kind === 'scene' ? 'Szene' : NOTE_KINDS[hit.kind].singular;
  }

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

function sectionOf(url: string): Section {
  const segment = url.split(/[?#]/)[0]!.split('/')[2];
  return NOTE_KIND_LIST.find((config) => config.path === segment)?.kind ?? 'manuscript';
}
