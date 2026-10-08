import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphFilterComponent } from './graph-filter-component';
import { frontendTestProviders } from '../../../testing/frontend-test-providers';

describe('GraphFilter', () => {
  let component: GraphFilterComponent;
  let fixture: ComponentFixture<GraphFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphFilterComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
