import { Component, computed, inject, input } from '@angular/core';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { DocumentEditor, type DocumentSource } from './document-editor';
import { SceneLinks } from './scene-links';
import { SceneStatusPicker } from './scene-status';

/** Eine Szene des Manuskripts: Route `write/scene/:id`. */
@Component({
  selector: 'wm-scene-page',
  imports: [DocumentEditor, SceneLinks, SceneStatusPicker],
  template: `
    <wm-document-editor [documentId]="id()" [source]="source">
      <h1 class="doc-title">{{ node()?.title }}</h1>
      <div class="scene-meta">
        @if (node(); as scene) {
          <wm-scene-status [node]="scene" />
        }
        <wm-scene-links [sceneId]="id()" />
      </div>
    </wm-document-editor>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100%;
    }

    .scene-meta {
      display: grid;
      gap: 0.4rem;
      margin: -0.75rem 0 2rem;
    }
  `,
})
export class ScenePage {
  readonly id = input.required<string>();

  private readonly api = inject(WortomatApi);
  private readonly store = inject(ProjectStore);

  protected readonly node = computed(() => this.store.findNode(this.id()));

  protected readonly source: DocumentSource = {
    load: (id) => this.api.sceneContent(id),
    save: async (id, request) => {
      await this.api.saveSceneContent(id, request);
      this.store.setWordCount(id, request.wordCount);
    },
  };
}
