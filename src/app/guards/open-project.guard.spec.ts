import { TestBed, async, inject } from '@angular/core/testing';

import { OpenProjectGuard } from './open-project.guard';

describe('OpenProjectGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpenProjectGuard]
    });
  });

  it('should ...', inject([OpenProjectGuard], (guard: OpenProjectGuard) => {
    expect(guard).toBeTruthy();
  }));
});
