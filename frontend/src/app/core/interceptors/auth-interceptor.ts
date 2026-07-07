import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    const tokenType = localStorage.getItem('tokenType') || 'Bearer';
    req = req.clone({
      setHeaders: {
        Authorization: `${tokenType} ${token}`
      }
    });
  }
  return next(req);
};
