import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import type { NoteKind } from '@wortomat/shared';
import { filter, map } from 'rxjs';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { NOTE_KIND_LIST } from '../notes/note-kinds';
import { NoteList } from '../notes/note-list';
import { NotesStore } from '../notes/notes-store';
import { GlobalSearch } from './global-search';
import { ManuscriptTree } from './manuscript-tree';

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
  imports: [RouterOutlet, DecimalPipe, ManuscriptTree, NoteList, GlobalSearch],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  // Pro geöffnetem Projekt frisch – die Notizen gehören zum Projekt.
  providers: [NotesStore],
})
export class WorkspacePage {
  private readonly router = inject(Router);
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly store = inject(ProjectStore);
  protected readonly notes = inject(NotesStore);

  protected readonly menu = MENU;
  protected readonly error = signal<string | null>(null);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly section = computed(() => sectionOf(this.url()));
  protected readonly sectionLabel = computed(
    () => MENU.find((item) => item.section === this.section())?.label ?? '',
  );
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
    if (item.section !== this.section()) {
      void this.router.navigateByUrl(this.lastUrls.get(item.section) ?? item.url);
    }
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
