import { ActivatedRouteSnapshot, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from './core/services/auth-service';

describe('AuthGuard', () => {
  function createGuard(isLoggedIn: boolean) {
    const authService = { isLoggedIn: jasmine.createSpy().and.returnValue(isLoggedIn) } as unknown as AuthService;
    const router = { navigate: jasmine.createSpy() } as unknown as Router;
    return { guard: new AuthGuard(authService, router), router };
  }

  it('redirects unauthenticated visitors away from categories', () => {
    const { guard, router } = createGuard(false);
    const route = { routeConfig: { path: 'categories' } } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('allows authenticated visitors to access categories', () => {
    const { guard, router } = createGuard(true);
    const route = { routeConfig: { path: 'categories' } } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
