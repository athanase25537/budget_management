import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard-component/dashboard-component';
import { StatsComponent } from './components/stats-component/stats-component';
import { TransactionComponent } from './components/transaction-component/transaction-component';
import { Login } from './components/login/login';
export const routes: Routes = [
    { path: "", redirectTo: 'login', pathMatch: 'full'},
    { path: "login", component: Login},
    { path: "dashboard", component: DashboardComponent },
    { path: "stats", component: StatsComponent },
    { path: "transactions", component: TransactionComponent },
];
