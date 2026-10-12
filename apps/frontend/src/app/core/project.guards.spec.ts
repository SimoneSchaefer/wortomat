import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type UrlTree } from '@angular/router';
import type { ProjectInfo } from '@wortomat/shared';
import { noProjectGuard, projectOpenGuard } from './project.guards';
import { ProjectStore } from './project-store';
import { WortomatApi } from './wortomat-api';

const PROJECT: ProjectInfo = {
  filePath: '/tmp/Roman.wortomat',
  title: 'Roman',
  author: '',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Projekt-Guards', () => {
  let openProject: ProjectInfo | null;

  beforeEach(() => {
    openProject = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: WortomatApi,
          useValue: {
            currentProject: async () => openProject,
            createProject: async () => (openProject = PROJECT),
            openProject: async () => (openProject = PROJECT),
            closeProject: async () => {
              openProject = null;
            },
            listNodes: async () => [],
          } satisfies Partial<WortomatApi>,
        },
      ],
    });
  });

  const run = (guard: typeof projectOpenGuard) =>
    TestBed.runInInjectionContext(() => guard({} as never, {} as never)) as Promise<
      boolean | UrlTree
    >;
  const urlOf = (result: boolean | UrlTree) =>
    result === true ? 'erlaubt' : TestBed.inject(Router).serializeUrl(result as UrlTree);

  it('lässt nach dem Anlegen eines Projekts ohne Neuladen in den Schreibbereich', async () => {
    // Startseite: noch kein Projekt offen
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');

    await TestBed.inject(ProjectStore).create('/tmp/Roman', 'Roman');

    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');
  });

  it('lässt nach dem Öffnen eines Projekts ohne Neuladen in den Schreibbereich', async () => {
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');

    await TestBed.inject(ProjectStore).open('/tmp/Roman.wortomat');

    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');
  });

  it('schickt nach dem Schließen zurück zur Startseite', async () => {
    const store = TestBed.inject(ProjectStore);
    await store.open('/tmp/Roman.wortomat');
    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');

    await store.close();

    expect(urlOf(await run(projectOpenGuard))).toBe('/');
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');
  });
});
