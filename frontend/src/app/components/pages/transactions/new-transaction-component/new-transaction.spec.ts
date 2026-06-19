import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewTransaction } from './new-transaction';

describe('NewTransaction', () => {
  let component: NewTransaction;
  let fixture: ComponentFixture<NewTransaction>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewTransaction]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewTransaction);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
