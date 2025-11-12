// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './services/auth-service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isConnected = this.authService.isLoggedIn();
    const currentPath = route.routeConfig?.path;

    // Si l'utilisateur est connecté ET essaie d'accéder à login/signup
    if (isConnected && (currentPath === 'login' || currentPath === 'signup' || currentPath === '')) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    // Si l'utilisateur n'est pas connecté ET essaie d'accéder aux pages protégées
    if (!isConnected && this.isProtectedRoute(currentPath)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }

  private isProtectedRoute(path: string | undefined): boolean {
    const protectedRoutes = ['dashboard', 'stats', 'transactions'];
    return protectedRoutes.includes(path || '');
  }
}