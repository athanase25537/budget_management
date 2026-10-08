import { TestBed } from '@angular/core/testing';

import { BudgetService } from './budget-service';
import { frontendTestProviders } from '../../testing/frontend-test-providers';

describe('BudgetService', () => {
  let service: BudgetService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [frontendTestProviders] });
    service = TestBed.inject(BudgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
