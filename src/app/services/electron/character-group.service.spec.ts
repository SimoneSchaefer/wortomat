import { TestBed } from '@angular/core/testing';

import { CharacterGroupService } from './character-group.service';

describe('CharacterGroupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CharacterGroupService = TestBed.get(CharacterGroupService);
    expect(service).toBeTruthy();
  });
});
