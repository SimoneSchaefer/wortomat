import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { SceneReference } from '@wortomat/shared';
import { Autofocus } from '../../core/autofocus';
import { I18n } from '../../core/i18n/i18n';
import { ProjectStore, type TreeItem } from '../../core/project-store';
import { statusInfo, type SceneStatusInfo } from '../../core/scene-status';
import { StatusIcon } from '../../core/status-icon';
import { normalizeForSearch } from './note-matching';

const MAX_OPTIONS = 30;

/** All scenes in book order, each with the titles of its parts/chapters. */
export function scenesInBookOrder(tree: readonly TreeItem[]): SceneReference[] {
  const result: SceneReference[] = [];
  const visit = (items: readonly TreeItem[], path: string[]) => {
    for (const { node, children } of items) {
      if (node.kind === 'scene') result.push({ id: node.id, title: node.title, path });
      else visit(children, [...path, node.title]);
    }
  };
  visit(tree, []);
  return result;
}

/** Matches the scene title and the chapter it is in ("Kapitel 3" finds all its scenes). */
export function filterScenes(
  scenes: readonly SceneReference[],
  query: string,
): readonly SceneReference[] {
  const needle = normalizeForSearch(query);
  if (!needle) return scenes;
  return scenes.filter((scene) =>
    normalizeForSearch([...scene.path, scene.title].join(' ')).includes(needle),
  );
}

/** The scene of an arc station: a chip leading to it, or "+ Scene" with a search. */
@Component({
  selector: 'wm-arc-scene-picker',
  imports: [Autofocus, StatusIcon],
  template: `
    <div class="add-wrapper">
      @if (scene(); as scene) {
        <span class="chip">
          <button
            type="button"
            class="open"
            [title]="
              t().arc.openScene +
              ': ' +
              [...scene.path, scene.title].join(' › ') +
              ' · ' +
              t().sceneStatus.names[statusOf(scene.id).status]
            "
            (click)="openScene(scene.id)"
          >
            <wm-status-icon
              [status]="statusOf(scene.id).status"
              [style.color]="statusOf(scene.id).color"
            />
            @if (scene.path.length) {
              <span class="path">{{ scene.path.at(-1) }} ›</span>
            }
            {{ scene.title }}
          </button>
          <button
            type="button"
            class="remove"
            [title]="t().arc.removeScene"
            [attr.aria-label]="t().arc.removeScene"
            (click)="picked.emit(null)"
          >
            ×
          </button>
        </span>
      } @else {
        <button
          type="button"
          class="link add-scene"
          [class.open]="open()"
          [attr.aria-expanded]="open()"
          (click)="toggle()"
        >
          {{ t().arc.addScene }}
        </button>
      }

      @if (open()) {
        <div class="picker" role="dialog" [attr.aria-label]="t().arc.scene">
          <input
            wmAutofocus
            role="combobox"
            aria-autocomplete="list"
            [attr.aria-activedescendant]="optionId(activeIndex())"
            [placeholder]="t().arc.searchScene"
            [value]="query()"
            (input)="onQuery($any($event.target).value)"
            (keydown)="onKeydown($event)"
          />
          <ul role="listbox">
            @for (option of options(); track option.id; let i = $index) {
              <li
                role="option"
                [id]="optionId(i)"
                [class.active]="i === activeIndex()"
                [attr.aria-selected]="i === activeIndex()"
                (pointerenter)="activeIndex.set(i)"
                (click)="choose(option)"
              >
                <wm-status-icon
                  [status]="statusOf(option.id).status"
                  [style.color]="statusOf(option.id).color"
                  [title]="t().sceneStatus.names[statusOf(option.id).status]"
                />
                <span class="option-text">
                  <span>{{ option.title }}</span>
                  @if (option.path.length) {
                    <small>{{ option.path.join(' › ') }}</small>
                  }
                </span>
              </li>
            } @empty {
              <li class="hint">{{ t().arc.noScenes }}</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  styleUrl: './arc-scene-picker.scss',
  host: { '(document:pointerdown)': 'onDocumentPointerDown($event)' },
})
export class ArcScenePicker {
  readonly sceneId = input.required<string | null>();
  readonly picked = output<string | null>();

  protected readonly t = inject(I18n).t;
  private readonly projectStore = inject(ProjectStore);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private static nextId = 0;
  private readonly idPrefix = `arc-scene-${ArcScenePicker.nextId++}-`;

  private readonly scenes = computed(() => scenesInBookOrder(this.projectStore.tree()));
  /** Title and chapter always current from the manuscript. */
  protected readonly scene = computed(() => {
    const id = this.sceneId();
    return id ? (this.scenes().find((scene) => scene.id === id) ?? null) : null;
  });

  protected readonly open = signal(false);
  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);
  protected readonly options = computed(() =>
    filterScenes(this.scenes(), this.query()).slice(0, MAX_OPTIONS),
  );

  /** Always current from the manuscript, as in the tree. */
  protected statusOf(sceneId: string): SceneStatusInfo {
    return statusInfo(this.projectStore.findNode(sceneId)?.status ?? 'idea');
  }

  protected optionId(index: number): string {
    return this.idPrefix + index;
  }

  protected toggle(): void {
    this.open.update((open) => !open);
    this.query.set('');
    this.activeIndex.set(0);
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex.set(count ? (this.activeIndex() + 1) % count : 0);
        break;
      case 'ArrowUp':
        this.activeIndex.set(count ? (this.activeIndex() - 1 + count) % count : 0);
        break;
      case 'Enter': {
        const option = this.options()[this.activeIndex()];
        if (option) this.choose(option);
        break;
      }
      case 'Escape':
        this.open.set(false);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onDocumentPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  protected choose(scene: SceneReference): void {
    this.open.set(false);
    this.picked.emit(scene.id);
  }

  protected openScene(id: string): void {
    void this.router.navigate(['/write/scene', id]);
  }
}
