import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  if (token) {
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    req = req.clone({
      setHeaders: {
        Authorization: `${tokenType} ${token}`
      }
    });
  }
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenType');
        localStorage.removeItem('user');
        localStorage.removeItem('settings');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
