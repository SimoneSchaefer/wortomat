import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionalImageComponent } from './optional-image.component';

describe('OptionalImageComponent', () => {
  let component: OptionalImageComponent;
  let fixture: ComponentFixture<OptionalImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OptionalImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OptionalImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
