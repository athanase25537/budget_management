import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionForm } from './transaction-form';
import { frontendTestProviders } from '../../../../testing/frontend-test-providers';

describe('TransactionForm', () => {
  let component: TransactionForm;
  let fixture: ComponentFixture<TransactionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionForm],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isIn', true);
    fixture.componentRef.setInput('isUpdate', false);
    fixture.componentRef.setInput('openForm', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
