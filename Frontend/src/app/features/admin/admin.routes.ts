import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'movies',      loadComponent: () => import('./movies/movies-admin.component').then(m => m.MoviesAdminComponent) },
      { path: 'screens',     loadComponent: () => import('./screens/screens-admin.component').then(m => m.ScreensAdminComponent) },
      { path: 'shows',       loadComponent: () => import('./shows/shows-admin.component').then(m => m.ShowsAdminComponent) },
      { path: 'concessions', loadComponent: () => import('./concessions/concessions-admin.component').then(m => m.ConcessionsAdminComponent) }
    ]
  }
];
