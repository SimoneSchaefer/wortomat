import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ProjectStore } from './project-store';

// Hinweis: inject() nur vor dem ersten await – danach gibt es keinen Injection-Kontext mehr.

/** Schreibbereich nur mit geöffnetem Projekt. */
export const projectOpenGuard: CanActivateFn = async () => {
  const store = inject(ProjectStore);
  const router = inject(Router);
  return (await store.ensureLoaded()) ? true : router.createUrlTree(['/']);
};

/** Startseite überspringen, wenn bereits ein Projekt offen ist. */
export const noProjectGuard: CanActivateFn = async () => {
  const store = inject(ProjectStore);
  const router = inject(Router);
  return (await store.ensureLoaded()) ? router.createUrlTree(['/write']) : true;
};
