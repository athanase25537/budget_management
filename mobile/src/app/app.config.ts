import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { LocalDatabaseService } from './core/data/local-database.service';
import { PreferencesService } from './core/services/preferences.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular({ mode: 'md' }),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAppInitializer(() => {
      const database = inject(LocalDatabaseService);
      const preferences = inject(PreferencesService);
      // Do not keep the entire interface inert while the native SQLite bridge starts.
      // Every repository request awaits the same initialization promise when needed.
      void database.initialize().then(() => preferences.initialize()).catch((error: unknown) => console.error('Initialisation locale impossible', error));
    }),
  ],
};
