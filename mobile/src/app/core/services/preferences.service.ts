import { Injectable, signal } from '@angular/core';
import { LocalDatabaseService, MobilePreferences } from '../data/local-database.service';

const DEFAULTS: MobilePreferences = { economy: 10, monthStartDay: 1, minValStat: 100, maxValStat: 100000, increment: 1000, language: 'fr', theme: 'light' };

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly state = signal<MobilePreferences>(DEFAULTS);
  constructor(private readonly database: LocalDatabaseService) {}

  async initialize(): Promise<void> { const value = await this.database.getPreferences(); this.state.set(value); this.applyTheme(value.theme); document.documentElement.lang = value.language; }
  async update(patch: Partial<MobilePreferences>): Promise<void> { const next = { ...this.state(), ...patch }; await this.database.updatePreferences(next); this.state.set(next); if (patch.theme) this.applyTheme(next.theme); if (patch.language) document.documentElement.lang = next.language; }
  private applyTheme(theme: MobilePreferences['theme']): void { const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme; document.body.classList.toggle('theme-light', resolved === 'light'); document.body.classList.toggle('theme-dark', resolved === 'dark'); }
}
