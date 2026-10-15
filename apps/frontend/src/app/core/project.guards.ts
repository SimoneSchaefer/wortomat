import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ProjectStore } from './project-store';

// inject() only before the first await – after it there is no injection context any more.

export const projectOpenGuard: CanActivateFn = async () => {
  const store = inject(ProjectStore);
  const router = inject(Router);
  return (await store.ensureLoaded()) ? true : router.createUrlTree(['/']);
};

export const noProjectGuard: CanActivateFn = async () => {
  const store = inject(ProjectStore);
  const router = inject(Router);
  return (await store.ensureLoaded()) ? router.createUrlTree(['/write']) : true;
};
