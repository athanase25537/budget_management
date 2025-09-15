import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { UserModel } from '../models/user-model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = "http://127.0.0.1:8000";
  private userSubject: BehaviorSubject<UserModel | null>;

  constructor(private httpClient: HttpClient) {
    // Charger l'utilisateur depuis localStorage si présent
    const savedUser = localStorage.getItem('user');
    this.userSubject = new BehaviorSubject<UserModel | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
  }

  /**
   * Envoie la requête de login
   */
  login(username: string, password: string) {
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
  setUser(user: UserModel) {
    this.userSubject.next(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Renvoie l'utilisateur sous forme d'observable
   */
  getUser() {
    return this.userSubject.asObservable();
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  /**
   * Déconnecte l'utilisateur et nettoie le stockage local
   */
  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }
}
