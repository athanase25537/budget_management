import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryComponent } from './category-component';
import { frontendTestProviders } from '../../../testing/frontend-test-providers';

describe('CategoryComponent', () => {
  let component: CategoryComponent;
  let fixture: ComponentFixture<CategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
