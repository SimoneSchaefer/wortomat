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
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

const DEFAULT_SIDEBAR_WIDTH = 272; // 17rem at medium font size
// Room for the heading and the "+" buttons next to it – even the longest variant ("MANUSCRIPT +
// Chapter + Part", measured at about 246px) fits on one line. With the word count after
// "Manuscript", the buttons move to a second line there.
const MIN_SIDEBAR_WIDTH = 256; // 16rem at medium font size
const MAX_SIDEBAR_WIDTH = 1000; // as in the backend
// Narrower than this (at medium font size), "Search the whole book" plus its shortcut no longer
// fits into the search (half the window width) – then only "Search".
const COMPACT_SEARCH_WIDTH = 760;
// Narrower than this, too little room would be left for the text next to the menu bar and the
// sidebar (the editor is up to 40rem wide) – then the sidebar becomes a popover.
const COMPACT_SIDEBAR_WIDTH = 1000;

interface MenuItem {
  section: Section;
  /** Where the menu item leads as long as nothing was opened there yet. */
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
    RouterLinkActive,
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
  // Fresh per opened project – notes, maps and the scene filter belong to the project.
  providers: [NotesStore, MapsStore, SceneFilter],
  host: {
    '(window:resize)': 'onWindowResize()',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
    '(keydown.escape)': 'onEscape($event)',
    // Back from the phone? Then check whether new notes are in "Downloads".
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

  // Sidebar width: stored in the app settings, at least 16rem and at most half the window width
  // (the text needs room). Minimum and default width grow with the chosen font size.
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

  protected readonly compactSearch = computed(
    () => this.windowWidth() < COMPACT_SEARCH_WIDTH * this.fontScale(),
  );
  protected readonly actionsOpen = signal(false);
  private readonly topActions = viewChild.required<ElementRef<HTMLElement>>('topActions');
  private readonly menuToggle = viewChild<ElementRef<HTMLButtonElement>>('menuToggle');

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
  /** Plot and statistics need no list on the left and take the full width. */
  protected readonly hasSidebar = computed(
    () => this.section() !== 'plot' && this.section() !== 'stats',
  );
  /** Title of the open scene or entry – for the bar in the content. */
  protected readonly currentTitle = computed(() => {
    const [, , segment, id, mapId] = this.url().split(/[?#]/)[0]!.split('/');
    if (!id) return null;
    if (segment === 'scene') return this.store.findNode(id)?.title;
    return id === 'maps' && mapId ? this.maps.find(mapId)?.name : this.notes.find(id)?.title;
  });
  /** Last opened page per area, so switching back continues there. */
  private readonly lastUrls = new Map<Section, string>();

  constructor() {
    effect(() => this.lastUrls.set(this.section(), this.url()));
    // Close it after picking (navigation) or when the window gets wide enough again
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

  /** @param refocus on Escape: focus back on the menu button */
  protected closeActions(refocus = false): void {
    if (!this.actionsOpen()) return;
    this.actionsOpen.set(false);
    if (refocus) this.menuToggle()?.nativeElement.focus();
  }

  protected onEscape(event: Event): void {
    this.closeActions(true);
    // Escape while renaming in the tree only cancels the renaming
    const target = event.target as Element;
    if (this.sidebarOpen() && !target.closest('input, textarea')) {
      this.sidebarOpen.set(false);
      this.sidebarToggle()?.nativeElement.focus();
    }
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as Element;
    if (!this.topActions().nativeElement.contains(target)) this.closeActions();
    // Clicks into the sidebar or a dialog opened from it (e.g. "Delete?") keep it open
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
