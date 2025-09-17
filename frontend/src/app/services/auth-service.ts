import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { UserModel } from '../models/user-model';
import { environment } from '../../environment';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private apiUrl = environment.apiUrl;
  private userSubject: BehaviorSubject<UserModel | null>;

  constructor(private httpClient: HttpClient) {
    // Charger l'utilisateur depuis localStorage si présent
    const savedUser = localStorage.getItem('user');
    const initialUser = savedUser ? JSON.parse(savedUser) : null;
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
    const isLoggedIn = this.userSubject.value !== null;
    return isLoggedIn;
  }

  /**
   * Déconnecte l'utilisateur et nettoie le stockage local
   */
  logout(): void {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  /**
   * Récupère la valeur actuelle de l'utilisateur (sans observable)
   */
  getCurrentUser(): UserModel | null {
    return this.userSubject.value;
  }
}