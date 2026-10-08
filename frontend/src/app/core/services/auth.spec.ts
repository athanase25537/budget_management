import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth-service';
import { frontendTestProviders } from '../../testing/frontend-test-providers';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [frontendTestProviders],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
