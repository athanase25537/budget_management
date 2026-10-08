import { TestBed } from '@angular/core/testing';

import { UserService } from './user-service';
import { frontendTestProviders } from '../../testing/frontend-test-providers';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [frontendTestProviders] });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
