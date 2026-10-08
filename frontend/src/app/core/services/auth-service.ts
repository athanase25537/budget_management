import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { UserModel } from '../models/user-model';
import { environment } from '../../core/environments/environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private apiUrl = environment.apiUrl;
  private userSubject: BehaviorSubject<UserModel | null>;

  constructor(private httpClient: HttpClient) {
    const savedUser = localStorage.getItem('user');
    let initialUser: UserModel | null = null;

    try {
      initialUser = savedUser ? JSON.parse(savedUser) as UserModel : null;
    } catch {
      this.clearSessionStorage();
    }

    if (!initialUser || this.isTokenExpired(localStorage.getItem('token'))) {
      initialUser = null;
      this.clearSessionStorage();
    }
    this.userSubject = new BehaviorSubject<UserModel | null>(initialUser);
  }

  /**
   * Envoie la requête de login
   */
  login(username: string, password: string): Observable<any> {
    const auth = { username, password };

    return this.httpClient.post(this.apiUrl + "/user/login", auth).pipe(
      map((data: any) => {
        if (data.status === "success" && data.user) {
          this.setUser(data.user);
         
          this.setToken(data["access_token"], data["token_type"]);
        }
        return {
          status: data.status,
          user: data.user
        }
      })
    );
  }

  /**
   * Définit l'utilisateur courant et le sauvegarde dans localStorage
   */
  setUser(user: UserModel): void {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  setToken(token: string, tokenType: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('tokenType', tokenType);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getTokenType(): string | null {
    return localStorage.getItem('tokenType');
  }

  /**
   * Renvoie l'utilisateur sous forme d'observable
   */
  getUser(): Observable<UserModel | null> {
    return this.userSubject.asObservable();
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    return this.userSubject.value !== null;
  }

  /**
   * Déconnecte l'utilisateur et nettoie le stockage local
   */
  logout(): void {
    this.userSubject.next(null);
    this.clearSessionStorage();
  }

  private clearSessionStorage(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenType');
    localStorage.removeItem('user');
    localStorage.removeItem('settings');
  }

  private isTokenExpired(token: string | null): boolean {
    if (!token) {
      return true;
    }

    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return true;
      }
      const normalizedPayload = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload));
      return typeof payload.exp !== 'number' || Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Récupère la valeur actuelle de l'utilisateur (sans observable)
   */
  getCurrentUser(): UserModel | null {
    return this.userSubject.value;
  }
}
