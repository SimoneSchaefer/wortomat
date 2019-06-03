import { TestBed } from '@angular/core/testing';

import { LocationGroupService } from './location-group.service';

describe('LocationGroupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LocationGroupService = TestBed.get(LocationGroupService);
    expect(service).toBeTruthy();
  });
});
