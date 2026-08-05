import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const MOVIES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./movie-list/movie-list.component').then(m => m.MovieListComponent) },
  { path: 'my-bookings', canActivate: [authGuard], loadComponent: () => import('./my-bookings/my-bookings.component').then(m => m.MyBookingsComponent) },
  { path: ':id/shows', loadComponent: () => import('./show-list/show-list.component').then(m => m.ShowListComponent) },
  { path: ':id/shows/:showId/seats', canActivate: [authGuard], loadComponent: () => import('./seat-selection/seat-selection.component').then(m => m.SeatSelectionComponent) }
];
