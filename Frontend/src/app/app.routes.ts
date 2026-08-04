import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default: redirect to movies homepage
  { path: '', redirectTo: 'movies', pathMatch: 'full' },

  // Auth routes — only for guests (logged-in users are redirected away)
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Public movie catalog — no auth required
  {
    path: 'movies',
    loadChildren: () => import('./features/movies/movies.routes').then(m => m.MOVIES_ROUTES)
  },

  // Admin section — requires login AND Admin role
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // Booking confirmation — requires login
  {
    path: 'booking/confirmation/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/movies/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent)
  },

  // Catch-all: unknown URLs go to movies
  { path: '**', redirectTo: 'movies' }
];
