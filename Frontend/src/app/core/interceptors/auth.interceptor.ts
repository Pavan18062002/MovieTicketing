import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

// Automatically attaches the JWT Bearer token to every outgoing HTTP request.
// Also catches 401 Unauthorized responses and auto-logs the user out,
// preventing the broken state where the UI shows "logged in" but all API calls fail.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        // Token expired or invalid — force logout so UI state matches reality
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};
