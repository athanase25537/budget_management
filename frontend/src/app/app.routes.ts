import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

// routes.ts
export const routes: Routes = [
    
    // Login & Signup - accessibles seulement si NON connecté
    { path: "", loadComponent: () => import('./components/layouts/landing-page/landing-page').then((m) => m.LandingPage), canActivate: [AuthGuard]},
    { path: "login", loadComponent: () => import('./components/auth/login/login').then((m) => m.Login), canActivate: [AuthGuard] },
    { path: "signup", loadComponent: () => import('./components/auth/signup/signup').then((m) => m.Signup), canActivate: [AuthGuard] },
  
    // Pages accessibles après connexion - protégées par le guard
    { path: "dashboard", loadComponent: () => import('./components/pages/dashboard/dashboard-component').then((m) => m.DashboardComponent), canActivate: [AuthGuard] },
    { path: "stats", loadComponent: () => import('./components/pages/statistics/stats-component').then((m) => m.StatsComponent), canActivate: [AuthGuard] },
    { path: "transactions", loadComponent: () => import('./components/pages/transactions/transaction-component/transaction-component').then((m) => m.TransactionComponent), canActivate: [AuthGuard] },
    { path: "categories", loadComponent: () => import('./components/pages/category/category-component').then((m) => m.CategoryComponent), canActivate: [AuthGuard]}
];
