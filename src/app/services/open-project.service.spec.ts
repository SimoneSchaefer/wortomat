import { TestBed } from '@angular/core/testing';

import { OpenProjectService } from './open-project.service';

describe('OpenProjectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OpenProjectService = TestBed.get(OpenProjectService);
    expect(service).toBeTruthy();
  });
});
