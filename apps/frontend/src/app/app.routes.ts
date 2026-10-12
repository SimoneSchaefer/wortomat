import type { Route, Routes } from '@angular/router';
import type { NoteKind } from '@wortomat/shared';
import { noProjectGuard, projectOpenGuard } from './core/project.guards';
import { NOTE_KINDS } from './features/notes/note-kinds';

const emptyState = () => import('./features/workspace/empty-state').then((m) => m.EmptyState);

/** `write/characters` (Auswahlhinweis) und `write/characters/:id` (Eintrag) – analog für Orte usw. */
function noteRoutes(kind: NoteKind): Route[] {
  const config = NOTE_KINDS[kind];
  return [
    {
      path: config.path,
      loadComponent: emptyState,
      data: {
        message: `Wähle links einen Eintrag aus – oder lege mit „${config.addLabel}“ einen neuen an.`,
      },
    },
    {
      path: `${config.path}/:id`,
      loadComponent: () => import('./features/notes/note-page').then((m) => m.NotePage),
      data: { kind },
    },
  ];
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [noProjectGuard],
    loadComponent: () => import('./features/start/start-page').then((m) => m.StartPage),
  },
  {
    path: 'write',
    canActivate: [projectOpenGuard],
    loadComponent: () => import('./features/workspace/workspace-page').then((m) => m.WorkspacePage),
    children: [
      {
        path: '',
        loadComponent: emptyState,
        data: {
          message: 'Wähle links eine Szene aus – oder lege mit „+“ an einem Kapitel eine neue an.',
        },
      },
      {
        path: 'scene/:id',
        // Der Editor (Tiptap/ProseMirror) wird erst geladen, wenn ein Dokument geöffnet wird.
        loadComponent: () => import('./features/editor/scene-page').then((m) => m.ScenePage),
      },
      ...noteRoutes('character'),
      ...noteRoutes('place'),
      ...noteRoutes('research'),
    ],
  },
  { path: '**', redirectTo: '' },
];
