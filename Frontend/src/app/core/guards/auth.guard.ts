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

/** Blocks access to SuperAdmin-only routes. */
export const superAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  if (auth.isSuperAdmin()) return true;
  inject(Router).navigate(['/admin']);
  return false;
};

/** Blocks access to Admin/SuperAdmin routes. Redirects regular users to movies. */
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
  
  if (auth.isSuperAdmin()) {
    inject(Router).navigate(['/super-admin']);
  } else if (auth.isAdmin()) {
    inject(Router).navigate(['/admin']);
  } else {
    inject(Router).navigate(['/movies']);
  }
  return false;
};
