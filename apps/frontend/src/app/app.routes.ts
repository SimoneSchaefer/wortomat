import type { Route, Routes } from '@angular/router';
import type { NoteKind } from '@wortomat/shared';
import type { Texts } from './core/i18n/i18n';
import { noProjectGuard, projectOpenGuard } from './core/project.guards';
import { NOTE_KINDS } from './features/notes/note-kinds';

const emptyState = () => import('./features/workspace/empty-state').then((m) => m.EmptyState);

function noteRoutes(kind: NoteKind): Route[] {
  const config = NOTE_KINDS[kind];
  return [
    {
      path: config.path,
      loadComponent: emptyState,
      data: {
        message: (t: Texts) => t.workspace.chooseNote(t.noteKinds[kind].addLabel),
      },
    },
    {
      path: `${config.path}/trash`,
      loadComponent: () => import('./features/workspace/trash-page').then((m) => m.TrashPage),
      data: { trashArea: kind },
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
        data: { message: (t: Texts) => t.workspace.chooseScene },
      },
      {
        path: 'scene/:id',
        // The editor (Tiptap/ProseMirror) is only loaded once a document is opened.
        loadComponent: () => import('./features/editor/scene-page').then((m) => m.ScenePage),
      },
      ...noteRoutes('character'),
      ...noteRoutes('place'),
      {
        path: 'places/maps/:id',
        loadComponent: () => import('./features/maps/map-page').then((m) => m.MapPage),
      },
      ...noteRoutes('research'),
      {
        path: 'plot',
        loadComponent: () => import('./features/plot/plot-page').then((m) => m.PlotPage),
      },
      {
        path: 'stats',
        loadComponent: () => import('./features/stats/stats-page').then((m) => m.StatsPage),
      },
      {
        path: 'trash',
        loadComponent: () => import('./features/workspace/trash-page').then((m) => m.TrashPage),
        data: { trashArea: 'manuscript' },
      },
    ],
  },
  {
    path: 'proofreading',
    canActivate: [projectOpenGuard],
    loadComponent: () =>
      import('./features/proofreading/proofreading-page').then((m) => m.ProofreadingPage),
  },
  {
    path: 'export',
    canActivate: [projectOpenGuard],
    loadComponent: () => import('./features/export/export-page').then((m) => m.ExportPage),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
  },
  { path: '**', redirectTo: '' },
];
