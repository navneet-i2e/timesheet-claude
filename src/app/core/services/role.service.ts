import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';

export type AppRole = 'employee' | 'manager' | 'admin';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private _role = signal<AppRole>('employee');

  role       = this._role.asReadonly();
  isEmployee = computed(() => this._role() === 'employee');
  isManager  = computed(() => this._role() === 'manager' || this._role() === 'admin');
  isAdmin    = computed(() => this._role() === 'admin');

  constructor(
    private auth: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    if (!isPlatformBrowser(platformId)) return;

    // Read role from Auth0 token namespace claim — set once on login
    this.auth.user$.subscribe(user => {
      console.log('USER FROM AUTH0:', user); 
      if (!user) {
        this._role.set('employee'); // reset on logout
        return;
      }
      // Auth0 roles arrive via a custom namespace claim added in a Rule/Action.
      // Configure your Auth0 Action to set: event.user.app_metadata.roles = ['admin']
      // and namespace it as 'https://timesheet.app/roles' in the ID token.
      const roles: string[] =
        (user as any)['https://timesheet.app/roles'] ||
        (user as any)['roles'] || [];

      if (roles.includes('admin'))        this._role.set('admin');
      else if (roles.includes('manager')) this._role.set('manager');
      else                                this._role.set('employee');
    });
  }
}
