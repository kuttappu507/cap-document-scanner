import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: 'scan', loadComponent: () => import('./pages/tabs/scan/scan.page').then((m) => m.ScanPage) },
      { path: 'library', loadComponent: () => import('./pages/tabs/library/library.page').then((m) => m.LibraryPage) },
      { path: 'settings', loadComponent: () => import('./pages/tabs/settings/settings.page').then((m) => m.SettingsPage) },
      { path: '', redirectTo: 'scan', pathMatch: 'full' },
    ],
  },
  {
    path: 'document/:id',
    loadComponent: () => import('./pages/document-detail/document-detail.page').then((m) => m.DocumentDetailPage),
  },
  { path: '', redirectTo: 'tabs/scan', pathMatch: 'full' },
  { path: '**', redirectTo: 'tabs/scan' },
];
