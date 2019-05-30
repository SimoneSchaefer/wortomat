import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlotlinesComponent } from './plotlines.component';

describe('PlotlinesComponent', () => {
  let component: PlotlinesComponent;
  let fixture: ComponentFixture<PlotlinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlotlinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlotlinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
