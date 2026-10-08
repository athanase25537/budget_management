import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionItemComponent } from './transaction-item-component';
import { frontendTestProviders } from '../../../../testing/frontend-test-providers';

describe('TransactionItemComponent', () => {
  let component: TransactionItemComponent;
  let fixture: ComponentFixture<TransactionItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionItemComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', {
      transactions: [],
      has_next_page: false,
      has_previous_page: false,
      current_page: 1,
      element_per_page: 10,
      total: 0,
      need_footer: false,
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
