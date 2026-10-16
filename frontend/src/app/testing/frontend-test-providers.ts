import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

export const frontendTestProviders = [
  provideHttpClient(),
  provideHttpClientTesting(),
  provideRouter([]),
  MessageService,
];
