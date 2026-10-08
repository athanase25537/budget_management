import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PieComponent } from './pie-component';
import { frontendTestProviders } from '../../../testing/frontend-test-providers';

describe('PieComponent', () => {
  let component: PieComponent;
  let fixture: ComponentFixture<PieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
