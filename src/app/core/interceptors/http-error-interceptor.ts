import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Token expired or missing — redirect to login
          router.navigate(['/login'], { queryParams: { reason: 'unauthenticated' } });
          break;
        case 403:
          // Authenticated but not authorised for this resource
          router.navigate(['/dashboard'], { queryParams: { reason: 'forbidden' } });
          break;
        case 404:
          console.warn('Resource not found:', req.url);
          break;
        default:
          console.error('HTTP error:', error.status, error.message);
      }
      return throwError(() => error);
    })
  );
};
