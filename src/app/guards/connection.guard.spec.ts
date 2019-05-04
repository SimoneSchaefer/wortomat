import { TestBed, async, inject } from '@angular/core/testing';

import { ConnectionGuard } from './connection.guard';

describe('ConnectionGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionGuard]
    });
  });

  it('should ...', inject([ConnectionGuard], (guard: ConnectionGuard) => {
    expect(guard).toBeTruthy();
  }));
});
