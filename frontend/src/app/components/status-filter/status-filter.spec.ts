import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusFilter } from './status-filter';

describe('StatusFilter', () => {
  let component: StatusFilter;
  let fixture: ComponentFixture<StatusFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
