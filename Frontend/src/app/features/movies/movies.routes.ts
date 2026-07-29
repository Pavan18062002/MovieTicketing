import { Routes } from '@angular/router';

export const MOVIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./movie-list/movie-list.component').then(m => m.MovieListComponent) },
  { path: ':id/shows', loadComponent: () => import('./show-list/show-list.component').then(m => m.ShowListComponent) }
];
