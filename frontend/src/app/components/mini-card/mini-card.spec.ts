import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniCard } from './mini-card';

describe('MiniCard', () => {
  let component: MiniCard;
  let fixture: ComponentFixture<MiniCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
