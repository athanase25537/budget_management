import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { frontendTestProviders } from './testing/frontend-test-providers';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [frontendTestProviders],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
