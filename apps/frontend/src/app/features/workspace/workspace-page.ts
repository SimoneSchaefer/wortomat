import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import type { NoteKind } from '@wortomat/shared';
import { filter, map } from 'rxjs';
import { AppSettingsStore } from '../../core/app-settings';
import { Appearance } from '../../core/appearance';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { PendingSaves } from '../../core/pending-saves';
import { ProofInboxStore } from '../../core/proof-inbox';
import { ProjectStore } from '../../core/project-store';
import { NOTE_KIND_LIST } from '../notes/note-kinds';
import { BookCover } from '../cover/book-cover';
import { BookDialog } from '../cover/book-dialog';
import { MapList } from '../maps/map-list';
import { MapsStore } from '../maps/maps-store';
import { NoteList } from '../notes/note-list';
import { NotesStore } from '../notes/notes-store';
import { GlobalSearch } from './global-search';
import { ManuscriptTree } from './manuscript-tree';
import { ResizeHandle } from './resize-handle';
import { SceneFilter } from './scene-filter';
import { SceneFilterPanel } from './scene-filter-panel';
import { StatusMessages } from '../../core/status-messages';

type Section = 'manuscript' | 'plot' | NoteKind | 'stats';

const DEFAULT_SIDEBAR_WIDTH = 272; // 17rem bei mittlerer Schriftgröße
// Platz für Überschrift und „+“-Buttons daneben – auch die längste Variante
// („MANUSCRIPT  + Chapter  + Part“, gemessen ca. 246px) passt in eine Zeile. Mit der Wortzahl
// hinter „Manuskript“ rutschen die Buttons dort in eine zweite Zeile.
const MIN_SIDEBAR_WIDTH = 256; // 16rem bei mittlerer Schriftgröße
const MAX_SIDEBAR_WIDTH = 1000; // wie im Backend
// Schmaler als das (bei mittlerer Schriftgröße) passt „Im ganzen Buch suchen“ samt Tastenkürzel
// nicht mehr in die Suche (halbe Fensterbreite) – dann nur „Suchen“.
const COMPACT_SEARCH_WIDTH = 760;
// Schmaler als das bliebe neben Menüleiste und Seitenleiste zu wenig Platz für den Text
// (Editor bis 40rem breit) – dann wird die Seitenleiste zum Popover.
const COMPACT_SIDEBAR_WIDTH = 1000;

interface MenuItem {
  section: Section;
  /** Wohin der Menüpunkt führt, solange dort noch nichts geöffnet war. */
  url: string;
}

const MENU: readonly MenuItem[] = [
  { section: 'manuscript', url: '/write' },
  { section: 'plot', url: '/write/plot' },
  ...NOTE_KIND_LIST.map((config) => ({ section: config.kind, url: `/write/${config.path}` })),
  { section: 'stats', url: '/write/stats' },
];

@Component({
  selector: 'wm-workspace-page',
  imports: [
    RouterOutlet,
    RouterLink,
    ManuscriptTree,
    NoteList,
    MapList,
    GlobalSearch,
    ResizeHandle,
    BookDialog,
    BookCover,
    SceneFilterPanel,
  ],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  // Pro geöffnetem Projekt frisch – Notizen, Karten und Szenenfilter gehören zum Projekt.
  providers: [NotesStore, MapsStore, SceneFilter],
  host: {
    '(window:resize)': 'onWindowResize()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(keydown.escape)': 'onEscape($event)',
    // Zurück vom Handy? Dann nachsehen, ob neue Notizen in „Downloads“ liegen.
    '(window:focus)': 'proofInbox.refresh()',
  },
})
export class WorkspacePage {
  private readonly router = inject(Router);
  protected readonly t = inject(I18n).t;
  private readonly pendingSaves = inject(PendingSaves);
  protected readonly store = inject(ProjectStore);
  protected readonly notes = inject(NotesStore);
  private readonly maps = inject(MapsStore);

  protected readonly settings = inject(AppSettingsStore);
  protected readonly proofInbox = inject(ProofInboxStore);

  protected readonly menu = MENU;
  protected readonly tree = viewChild(ManuscriptTree);
  protected readonly noteList = viewChild(NoteList);

  // Breite der Seitenleiste: gespeichert in den App-Einstellungen, begrenzt auf
  // mindestens 16rem und höchstens die halbe Fensterbreite (der Text braucht Platz).
  // Mindest- und Standardbreite wachsen mit der eingestellten Schriftgröße.
  private readonly fontScale = inject(Appearance).fontScale;
  protected readonly minSidebarWidth = computed(() =>
    Math.round(MIN_SIDEBAR_WIDTH * this.fontScale()),
  );
  protected readonly windowWidth = signal(window.innerWidth);
  protected readonly maxSidebarWidth = computed(() =>
    Math.max(
      this.minSidebarWidth(),
      Math.min(MAX_SIDEBAR_WIDTH, Math.floor(this.windowWidth() / 2)),
    ),
  );
  protected readonly sidebarWidth = computed(() => {
    const stored = this.settings.settings().sidebarWidth;
    const width = stored ?? Math.round(DEFAULT_SIDEBAR_WIDTH * this.fontScale());
    return Math.min(this.maxSidebarWidth(), Math.max(this.minSidebarWidth(), width));
  });
  private readonly error = inject(StatusMessages).channel();

  /** Schmales Fenster: kürzerer Platzhalter in der Suche. */
  protected readonly compactSearch = computed(
    () => this.windowWidth() < COMPACT_SEARCH_WIDTH * this.fontScale(),
  );
  /** Burger-Menü oben rechts (Korrektur, Export, Einstellungen, Schließen). */
  protected readonly actionsOpen = signal(false);
  private readonly topActions = viewChild.required<ElementRef<HTMLElement>>('topActions');
  private readonly menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');

  /** Schmales Fenster: die Seitenleiste öffnet sich als Popover über dem Inhalt. */
  protected readonly compactSidebar = computed(
    () => this.hasSidebar() && this.windowWidth() < COMPACT_SIDEBAR_WIDTH * this.fontScale(),
  );
  protected readonly sidebarOpen = signal(false);
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly sidebarToggle = viewChild<ElementRef<HTMLButtonElement>>('sidebarToggle');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly section = computed(() => sectionOf(this.url()));
  protected readonly sectionLabel = computed(() => this.labelOf(this.section()));
  protected readonly noteKind = computed(() => {
    const section = this.section();
    return section === 'manuscript' || section === 'plot' || section === 'stats' ? null : section;
  });
  /** Handlung und Statistik brauchen keine Liste links und nehmen die ganze Breite. */
  protected readonly hasSidebar = computed(
    () => this.section() !== 'plot' && this.section() !== 'stats',
  );
  /** Titel der geöffneten Szene bzw. des geöffneten Eintrags – für die Leiste im Inhalt. */
  protected readonly currentTitle = computed(() => {
    const [, , segment, id, mapId] = this.url().split(/[?#]/)[0]!.split('/');
    if (!id) return null;
    if (segment === 'scene') return this.store.findNode(id)?.title;
    return id === 'maps' && mapId ? this.maps.find(mapId)?.name : this.notes.find(id)?.title;
  });
  /** Zuletzt geöffnete Seite je Bereich, damit man beim Zurückwechseln dort weitermacht. */
  private readonly lastUrls = new Map<Section, string>();

  constructor() {
    effect(() => this.lastUrls.set(this.section(), this.url()));
    // Nach der Auswahl (Navigation) oder wenn das Fenster wieder breit genug ist: zu
    effect(() => {
      this.url();
      this.compactSidebar();
      untracked(() => this.sidebarOpen.set(false));
    });
    this.notes.load().catch((error: unknown) => this.error.set(errorMessage(error, this.t())));
    this.maps.load().catch((error: unknown) => this.error.set(errorMessage(error, this.t())));
    void this.proofInbox.refresh();
  }

  protected labelOf(section: Section): string {
    const t = this.t();
    if (section === 'manuscript') return t.workspace.manuscript;
    if (section === 'plot') return t.plot.title;
    if (section === 'stats') return t.stats.title;
    return t.noteKinds[section].label;
  }

  protected onWindowResize(): void {
    this.windowWidth.set(window.innerWidth);
  }

  /** @param refocus bei Escape: Fokus zurück auf den Menü-Knopf */
  protected closeActions(refocus = false): void {
    if (!this.actionsOpen()) return;
    this.actionsOpen.set(false);
    if (refocus) this.menuToggle()?.nativeElement.focus();
  }

  protected onEscape(event: Event): void {
    this.closeActions(true);
    // Escape beim Umbenennen im Baum bricht nur das Umbenennen ab
    const target = event.target as Element;
    if (this.sidebarOpen() && !target.closest('input, textarea')) {
      this.sidebarOpen.set(false);
      this.sidebarToggle()?.nativeElement.focus();
    }
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as Element;
    if (!this.topActions().nativeElement.contains(target)) this.closeActions();
    // Klicks in die Seitenleiste oder einen Dialog daraus (z. B. „Löschen?“) lassen sie offen
    const inSidebar =
      this.sidebar()?.nativeElement.contains(target) ||
      this.sidebarToggle()?.nativeElement.contains(target) ||
      !!target.closest('dialog');
    if (!inSidebar) this.sidebarOpen.set(false);
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
      this.error.set(errorMessage(error, this.t()));
    }
  }
}

function sectionOf(url: string): Section {
  const segment = url.split(/[?#]/)[0]!.split('/')[2];
  if (segment === 'stats') return 'stats';
  if (segment === 'plot') return 'plot';
  return NOTE_KIND_LIST.find((config) => config.path === segment)?.kind ?? 'manuscript';
}
