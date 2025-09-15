// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { BudgetService } from './services/budget-service';
import { AuthService } from './services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isConnected = this.authService.isLoggedIn(); // à implémenter dans ton service

    if (isConnected) {
      this.router.navigate(['/dashboard']);
      return false; // empêche d'aller sur /login
    }

    return true; // autorise si non connecté
  }
}
