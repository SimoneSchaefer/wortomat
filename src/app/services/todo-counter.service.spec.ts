import { TestBed } from '@angular/core/testing';

import { TodoCounterService } from './todo-counter.service';

describe('TodoCounterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TodoCounterService = TestBed.get(TodoCounterService);
    expect(service).toBeTruthy();
  });
});
