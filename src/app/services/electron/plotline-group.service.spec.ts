import { TestBed } from '@angular/core/testing';

import { PlotlineGroupService } from './plotline-group.service';

describe('PlotlineGroupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlotlineGroupService = TestBed.get(PlotlineGroupService);
    expect(service).toBeTruthy();
  });
});
