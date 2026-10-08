import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusFilter } from './status-filter';
import { frontendTestProviders } from '../../../testing/frontend-test-providers';

describe('StatusFilter', () => {
  let component: StatusFilter;
  let fixture: ComponentFixture<StatusFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusFilter],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusFilter);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isFirstTransaction', false);
    fixture.componentRef.setInput('needAdvancedFilter', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
