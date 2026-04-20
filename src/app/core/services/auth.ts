import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';

/**
 * Thin wrapper around Auth0's AuthService.
 * Provides a single injection point for authentication state
 * used across the application.
 */
@Injectable({
  providedIn: 'root',
})
export class Auth {
  isAuthenticated$: Observable<boolean>;
  user$: Observable<any>;

  constructor(private auth0: Auth0Service) {
    this.isAuthenticated$ = this.auth0.isAuthenticated$;
    this.user$            = this.auth0.user$;
  }

  loginWithRedirect(): void {
    this.auth0.loginWithRedirect();
  }

  logout(): void {
    this.auth0.logout({
      logoutParams: { returnTo: window.location.origin }
    });
  }
}
