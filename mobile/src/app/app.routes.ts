import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tabs/home' },
  { path: 'account', loadComponent: () => import('./features/account/account.page').then((module) => module.AccountPage) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.page').then((module) => module.SettingsPage) },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.page').then((module) => module.TabsPage),
    children: [
      { path: 'home', loadComponent: () => import('./features/home/home.page').then((module) => module.HomePage) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.page').then((module) => module.TransactionsPage) },
      { path: 'add', loadComponent: () => import('./features/add-transaction/add-transaction.page').then((module) => module.AddTransactionPage) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics.page').then((module) => module.AnalyticsPage) },
      { path: 'categories', loadComponent: () => import('./features/categories/categories.page').then((module) => module.CategoriesPage) },
      { path: '', pathMatch: 'full', redirectTo: 'home' },
    ],
  },
  { path: '**', redirectTo: 'tabs/home' },
];
