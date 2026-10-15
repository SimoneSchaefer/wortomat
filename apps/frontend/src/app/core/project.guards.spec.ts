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
  coverImageId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('project guards', () => {
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

  it('lets into the writing area after creating a project, without reloading', async () => {
    // start page: no project open yet
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');

    await TestBed.inject(ProjectStore).create('/tmp/Roman', 'Roman');

    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');
  });

  it('lets into the writing area after opening a project, without reloading', async () => {
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');

    await TestBed.inject(ProjectStore).open('/tmp/Roman.wortomat');

    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');
  });

  it('sends back to the start page after closing', async () => {
    const store = TestBed.inject(ProjectStore);
    await store.open('/tmp/Roman.wortomat');
    expect(urlOf(await run(projectOpenGuard))).toBe('erlaubt');

    await store.close();

    expect(urlOf(await run(projectOpenGuard))).toBe('/');
    expect(urlOf(await run(noProjectGuard))).toBe('erlaubt');
  });
});
