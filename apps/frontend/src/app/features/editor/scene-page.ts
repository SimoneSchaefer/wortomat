import { Component, computed, inject, input } from '@angular/core';
import { ProjectStore } from '../../core/project-store';
import { WortomatApi } from '../../core/wortomat-api';
import { DocumentEditor, type DocumentSource } from './document-editor';

/** Eine Szene des Manuskripts: Route `write/scene/:id`. */
@Component({
  selector: 'wm-scene-page',
  imports: [DocumentEditor],
  template: `
    <wm-document-editor [documentId]="id()" [source]="source">
      <h1 class="doc-title">{{ node()?.title }}</h1>
    </wm-document-editor>
  `,
  styles: ':host { display: block; min-height: 100%; }',
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
