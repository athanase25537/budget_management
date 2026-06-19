import { Routes } from '@angular/router';
import { DashboardComponent } from './components/pages/dashboard/dashboard-component';
import { StatsComponent } from './components/pages/statistics/stats-component';
import { TransactionComponent } from './components/pages/transactions/transaction-component/transaction-component';
import { Login } from './components/auth/login/login';
import { AuthGuard } from './auth.guard';
import { Signup } from './components/auth/signup/signup';
import { LandingPage } from './components/layouts/landing-page/landing-page';
import { CategoryComponent } from './components/pages/category/category-component';

// routes.ts
export const routes: Routes = [
    
    // Login & Signup - accessibles seulement si NON connecté
    { path: "", component: LandingPage, canActivate: [AuthGuard]},
    { path: "login", component: Login, canActivate: [AuthGuard] },
    { path: "signup", component: Signup, canActivate: [AuthGuard] },
  
    // Pages accessibles après connexion - protégées par le guard
    { path: "dashboard", component: DashboardComponent, canActivate: [AuthGuard] },
    { path: "stats", component: StatsComponent, canActivate: [AuthGuard] },
    { path: "transactions", component: TransactionComponent, canActivate: [AuthGuard] },
    { path: "categories", component: CategoryComponent, canActivate: [AuthGuard]}
];
