import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

/** Uses Android Keystore / iOS Keychain in native builds. Web is development-only. */
@Injectable({ providedIn: 'root' })
export class SessionStorageService {
  async get(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const value = await SecureStorage.get(key);
      return typeof value === 'string' ? value : null;
    }
    return (await Preferences.get({ key })).value;
  }

  async set(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) { await SecureStorage.set(key, value); return; }
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) { await SecureStorage.remove(key); return; }
    await Preferences.remove({ key });
  }
}
