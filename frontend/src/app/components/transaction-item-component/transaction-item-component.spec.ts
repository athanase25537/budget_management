import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionItemComponent } from './transaction-item-component';

describe('TransactionItemComponent', () => {
  let component: TransactionItemComponent;
  let fixture: ComponentFixture<TransactionItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
