import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type { SearchHit } from '@wortomat/shared';
import { errorMessage } from '../../core/errors';
import { I18n } from '../../core/i18n/i18n';
import { SearchRequest } from '../../core/search-request';
import { WortomatApi } from '../../core/wortomat-api';
import { groupHits, hitLink } from './search-hits';
import { StatusMessages } from '../../core/status-messages';

const SEARCH_DELAY_MS = 250;

/**
 * Suche über das ganze Buch (Szenen, Charaktere, Orte, Forschung) in der oberen Leiste.
 * Strg+K / ⌘K springt von überall hinein; Treffer erscheinen gruppiert darunter.
 */
@Component({
  selector: 'wm-global-search',
  templateUrl: './global-search.html',
  styleUrl: './global-search.scss',
  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
})
export class GlobalSearch {
  private readonly api = inject(WortomatApi);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  protected readonly shortcut = computed(() => this.i18n.shortcut()('K'));
  /** Schmales Fenster: nur „Suchen“ als Platzhalter. */
  readonly compact = input(false);
  protected readonly query = signal('');
  protected readonly hits = signal<SearchHit[]>([]);
  protected readonly loading = signal(false);
  private readonly error = inject(StatusMessages).channel();
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);

  protected readonly groups = computed(() => groupHits(this.hits()));
  /** Treffer in Anzeige-Reihenfolge – für die Tastaturnavigation. */
  private readonly flat = computed(() => this.groups().flatMap((group) => group.hits));
  protected readonly showResults = computed(() => this.open() && !!this.query().trim());

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Suche von anderswo angestoßen: Begriff eintragen, Ergebnisse zeigen, Fokus ins Feld
    const requests = inject(SearchRequest);
    effect(() => {
      const request = requests.request();
      if (!request) return;
      this.onInput(request.query);
      const input = this.input().nativeElement;
      input.value = request.query;
      input.focus();
    });
  }

  protected indexOf(hit: SearchHit): number {
    return this.flat().indexOf(hit);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.open.set(true);
    this.activeIndex.set(0);
    clearTimeout(this.searchTimer);
    if (!value.trim()) {
      this.hits.set([]);
      return;
    }
    this.loading.set(true);
    this.searchTimer = setTimeout(async () => {
      try {
        const hits = await this.api.search(value);
        // Nur übernehmen, wenn die Eingabe sich inzwischen nicht geändert hat.
        if (this.query() === value) {
          this.hits.set(hits);
          this.error.set(null);
        }
      } catch (error) {
        this.error.set(errorMessage(error, this.t()));
      } finally {
        if (this.query() === value) this.loading.set(false);
      }
    }, SEARCH_DELAY_MS);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.flat().length;
    switch (event.key) {
      case 'ArrowDown':
        this.open.set(true);
        this.moveActive(count ? (this.activeIndex() + 1) % count : 0);
        break;
      case 'ArrowUp':
        this.moveActive(count ? (this.activeIndex() - 1 + count) % count : 0);
        break;
      case 'Enter': {
        const hit = this.flat()[this.activeIndex()];
        if (hit) this.go(hit);
        break;
      }
      case 'Escape':
        // Erst Ergebnisliste schließen, beim zweiten Mal Eingabe leeren und Fokus abgeben.
        if (this.showResults()) {
          this.open.set(false);
        } else {
          this.onInput('');
          this.input().nativeElement.blur();
        }
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected clear(): void {
    this.onInput('');
    this.input().nativeElement.focus();
  }

  protected go(hit: SearchHit): void {
    this.open.set(false);
    this.input().nativeElement.blur();
    void this.router.navigate(hitLink(hit));
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = this.input().nativeElement;
      input.focus();
      input.select();
      this.open.set(true);
    }
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  private moveActive(index: number): void {
    this.activeIndex.set(index);
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector('.hit.active')?.scrollIntoView({ block: 'nearest' }),
      { injector: this.injector },
    );
  }
}
