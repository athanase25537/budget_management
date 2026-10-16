import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { SessionStorageService } from './session-storage.service';

export interface Account { id: number; name: string; first_name: string | null; username: string; solde: number; }
interface AuthResponse { status: 'success' | 'fail'; user?: Account; access_token?: string; token_type?: string; message?: string; }
// The browser keeps using the local API during development. Native builds use the
// deployed HTTPS API so they work on both emulators and physical Android devices.
export const API_URL = Capacitor.isNativePlatform()
  ? 'https://budget-management-backend-jwjl.onrender.com'
  : 'http://localhost:8000';

@Injectable({ providedIn: 'root' })
export class AccountService {
  readonly account = signal<Account | null>(null);
  readonly initialized = signal(false);

  constructor(private readonly http: HttpClient, private readonly storage: SessionStorageService) { void this.restore(); }

  async login(username: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/user/login`, { username, password }));
    if (response.status !== 'success' || !response.user || !response.access_token) throw new Error('Identifiant ou mot de passe incorrect.');
    await this.persist(response.user, response.access_token, response.token_type ?? 'Bearer');
  }

  async register(input: { name: string; firstName: string; username: string; password: string }): Promise<void> {
    const response = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/user/add-user`, { name: input.name, first_name: input.firstName, username: input.username, password: input.password, solde: 0 }));
    if (response.status !== 'success') throw new Error(response.message ?? 'Impossible de créer le compte.');
    await this.login(input.username, input.password);
  }

  async updateProfile(input: { name: string; firstName: string; username: string; password?: string }): Promise<void> {
    const headers = new HttpHeaders(await this.authorizationHeaders());
    const payload = {
      name: input.name,
      first_name: input.firstName,
      username: input.username,
      ...(input.password?.trim() ? { password: input.password } : {}),
    };
    const response = await firstValueFrom(this.http.put<AuthResponse>(`${API_URL}/user/user-update-by-id`, payload, { headers }));
    if (response.status !== 'success' || !response.user) throw new Error(response.message ?? 'Impossible de mettre à jour le profil.');
    const token = await this.storage.get('kajy-vola-token');
    const tokenType = (await this.storage.get('kajy-vola-token-type')) ?? 'Bearer';
    if (!token) throw new Error('Connectez-vous avant de modifier le profil.');
    await this.persist(response.user, token, tokenType);
  }

  async authorizationHeaders(): Promise<Record<string, string>> {
    const token = await this.storage.get('kajy-vola-token');
    const tokenType = (await this.storage.get('kajy-vola-token-type')) ?? 'Bearer';
    if (!token) throw new Error('Connectez-vous avant de synchroniser.');
    return { Authorization: `${tokenType} ${token}` };
  }

  async logout(): Promise<void> { await this.storage.remove('kajy-vola-token'); await this.storage.remove('kajy-vola-token-type'); await this.storage.remove('kajy-vola-account'); this.account.set(null); }

  private async restore(): Promise<void> { const stored = await this.storage.get('kajy-vola-account'); if (stored) { try { this.account.set(JSON.parse(stored) as Account); } catch { await this.logout(); } } this.initialized.set(true); }
  private async persist(account: Account, token: string, tokenType: string): Promise<void> { await this.storage.set('kajy-vola-token', token); await this.storage.set('kajy-vola-token-type', tokenType); await this.storage.set('kajy-vola-account', JSON.stringify(account)); this.account.set(account); }
}
