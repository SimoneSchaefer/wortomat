import type { Routes } from '@angular/router';
import { noProjectGuard, projectOpenGuard } from './core/project.guards';

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
        loadComponent: () => import('./features/workspace/no-scene').then((m) => m.NoScene),
      },
      {
        path: 'scene/:id',
        // Der Editor (Tiptap/ProseMirror) wird erst geladen, wenn eine Szene geöffnet wird.
        loadComponent: () => import('./features/editor/scene-editor').then((m) => m.SceneEditor),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
