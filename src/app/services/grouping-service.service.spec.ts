import { TestBed } from '@angular/core/testing';

import { GroupingServiceService } from './grouping-service.service';

describe('GroupingServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GroupingServiceService = TestBed.get(GroupingServiceService);
    expect(service).toBeTruthy();
  });
});
