import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import type { NoteKind } from '@wortomat/shared';
import { filter, map } from 'rxjs';
import { AppSettingsStore } from '../../core/app-settings';
import { errorMessage } from '../../core/errors';
import { PendingSaves } from '../../core/pending-saves';
import { ProjectStore } from '../../core/project-store';
import { NOTE_KIND_LIST } from '../notes/note-kinds';
import { ExportDialog } from '../export/export-dialog';
import { NoteList } from '../notes/note-list';
import { NotesStore } from '../notes/notes-store';
import { GlobalSearch } from './global-search';
import { ManuscriptTree } from './manuscript-tree';
import { ResizeHandle } from './resize-handle';

type Section = 'manuscript' | NoteKind;

const DEFAULT_SIDEBAR_WIDTH = 272; // 17rem
const MIN_SIDEBAR_WIDTH = 192; // 12rem
const MAX_SIDEBAR_WIDTH = 1000; // wie im Backend

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
  imports: [
    RouterOutlet,
    DecimalPipe,
    ManuscriptTree,
    NoteList,
    GlobalSearch,
    ResizeHandle,
    ExportDialog,
  ],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  // Pro geöffnetem Projekt frisch – die Notizen gehören zum Projekt.
  providers: [NotesStore],
  host: { '(window:resize)': 'onWindowResize()' },
})
export class WorkspacePage {
  private readonly router = inject(Router);
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly store = inject(ProjectStore);
  protected readonly notes = inject(NotesStore);

  protected readonly settings = inject(AppSettingsStore);

  protected readonly menu = MENU;

  // Breite der Seitenleiste: gespeichert in den App-Einstellungen, begrenzt auf
  // mindestens 12rem und höchstens die halbe Fensterbreite (der Text braucht Platz).
  protected readonly minSidebarWidth = MIN_SIDEBAR_WIDTH;
  protected readonly windowWidth = signal(window.innerWidth);
  protected readonly maxSidebarWidth = computed(() =>
    Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, Math.floor(this.windowWidth() / 2))),
  );
  protected readonly sidebarWidth = computed(() =>
    Math.min(
      this.maxSidebarWidth(),
      Math.max(MIN_SIDEBAR_WIDTH, this.settings.settings().sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH),
    ),
  );
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

  protected onWindowResize(): void {
    this.windowWidth.set(window.innerWidth);
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
