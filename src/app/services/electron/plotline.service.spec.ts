import { TestBed } from '@angular/core/testing';

import { PlotlineService } from './plotline.service';

describe('PlotlineService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PlotlineService = TestBed.get(PlotlineService);
    expect(service).toBeTruthy();
  });
});
