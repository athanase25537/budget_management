import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard-component/dashboard-component';
import { StatsComponent } from './components/stats-component/stats-component';
import { TransactionComponent } from './components/transaction-component/transaction-component';
import { Login } from './components/login/login';
import { AuthGuard } from './auth.guard';
import { Signup } from './components/signup/signup';
import { LandingPage } from './components/landing-page/landing-page';

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
];
