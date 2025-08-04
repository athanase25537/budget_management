import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard-component/dashboard-component';
import { StatsComponent } from './components/stats-component/stats-component';
import { TransactionComponent } from './components/transaction-component/transaction-component';

export const routes: Routes = [
    { path: "", component: DashboardComponent },
    { path: "dashboard", component: DashboardComponent },
    { path: "stats", component: StatsComponent },
    { path: "transactions", component: TransactionComponent },
];
