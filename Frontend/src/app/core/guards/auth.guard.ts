import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Blocks access to routes that require a logged-in user. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/auth/login']);
  return false;
};

/** Blocks access to Admin-only routes. Redirects regular users to movies. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isAdmin()) return true;
  inject(Router).navigate(['/movies']);
  return false;
};

/** Blocks already-logged-in users from reaching login/register pages. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (!auth.isLoggedIn()) return true;
  // Redirect to the correct home based on role
  const dest = auth.isAdmin() ? '/admin' : '/movies';
  inject(Router).navigate([dest]);
  return false;
};
