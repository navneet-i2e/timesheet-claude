import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  active: boolean;
}

export interface Brand {
  name: string;
  icon: string;
  tagline: string;
}

export interface NavData {
  brand: Brand;
  navItems: NavItem[];
}

// Static nav data — no HTTP call, instant load
const STATIC_NAV_DATA: NavData = {
  brand: {
    name: 'I2E Timesheet',
    icon: '/',
    tagline: 'Timesheet Management',
  },
  navItems: [
    { id: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'home', active: true },
    { id: 'timesheet', label: 'Timesheet', route: '/timesheet', icon: 'clock', active: false },
    {
      id: 'my-template',
      label: 'My Template',
      route: '/my-template',
      icon: 'file-text',
      active: false,
    },
    { id: 'report', label: 'Reports', route: '/report', icon: 'bar-chart-2', active: false },
    // { id: 'punch',     label: 'Punch',     route: '/punch',     icon: 'timer', active: false }
    { id: 'help', label: 'Help', route: '/help', icon: 'help-circle', active: false },
    { id: 'admin', label: 'Admin', route: '/admin/projects', icon: 'shield', active: false },
  ],
};

@Injectable({ providedIn: 'root' })
export class HeaderService {
  /** Returns nav data synchronously via of() — instant, zero network round-trip */
  getNavData(): Observable<NavData> {
    return of(STATIC_NAV_DATA);
  }
}
