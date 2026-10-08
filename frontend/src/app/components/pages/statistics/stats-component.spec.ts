import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatsComponent } from './stats-component';
import { frontendTestProviders } from '../../../testing/frontend-test-providers';

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
