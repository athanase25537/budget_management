import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionComponent } from './transaction-component';
import { frontendTestProviders } from '../../../../testing/frontend-test-providers';

describe('TransactionComponent', () => {
  let component: TransactionComponent;
  let fixture: ComponentFixture<TransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionComponent],
      providers: [frontendTestProviders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
