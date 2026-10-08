import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings-service';
import { frontendTestProviders } from '../../testing/frontend-test-providers';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [frontendTestProviders] });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
