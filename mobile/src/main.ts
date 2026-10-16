import { bootstrapApplication } from '@angular/platform-browser';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements } from 'jeep-sqlite/loader';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// SQLite uses this web component to persist browser-development data in IndexedDB.
// Register and connect it before Angular starts: otherwise a first repository call
// can race the Stencil component's setup and leave the web store unavailable.
async function startApplication(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    await defineCustomElements(window);

    if (!document.querySelector('jeep-sqlite')) {
      const webStore = document.createElement('jeep-sqlite');
      // Stencil exposes the HTML attribute as `autosave` (not `auto-save`).
      // This keeps browser preview data durable across a page reload as well.
      webStore.setAttribute('autosave', 'true');
      document.body.appendChild(webStore);
    }

    await customElements.whenDefined('jeep-sqlite');
  }

  await bootstrapApplication(AppComponent, appConfig);
}

void startApplication().catch((error: unknown) => console.error(error));
