import { TestBed } from '@angular/core/testing';

import { BackgroundGroupService } from './background-group.service';

describe('BackgroundGroupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackgroundGroupService = TestBed.get(BackgroundGroupService);
    expect(service).toBeTruthy();
  });
});
