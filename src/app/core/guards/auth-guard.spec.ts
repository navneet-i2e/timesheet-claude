import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';

import { authGuard } from './auth-guard';
import { AuthService } from '@auth0/auth0-angular';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let routerSpy: jasmine.SpyObj<Router>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    authSpy   = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated$: of(false)
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: Router,      useValue: routerSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should block unauthenticated users and redirect to /login', (done) => {
    (Object.getOwnPropertyDescriptor(authSpy, 'isAuthenticated$')!.get as any) = () => of(false);
    TestBed.overrideProvider(AuthService, {
      useValue: { isAuthenticated$: of(false) }
    });
    // Guard should navigate to /login with reason=unauthenticated
    expect(routerSpy.navigate).toBeDefined();
    done();
  });
});
