import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMedComponent } from './card-med-component';

describe('CardMedComponent', () => {
  let component: CardMedComponent;
  let fixture: ComponentFixture<CardMedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardMedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardMedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
