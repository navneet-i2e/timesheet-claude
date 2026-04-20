import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { AuthService, User } from '@auth0/auth0-angular';
import { filter } from 'rxjs/operators';

import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';

import { HeaderService, NavItem, Brand } from '../../core/services/header';
import { ThemeService } from '../../core/services/theme.service';
import { RoleService } from '../../core/services/role.service';

export interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    TooltipModule,
    TagModule,
    BadgeModule,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class HeaderComponent implements OnInit {
  navItems: NavItem[] = [];
  brand: Brand | null = null;
  activeRoute = '';
  imageError = false;
  isMobileMenuOpen = false;
  isScrolled = false;
  isRouteLoading = false;
  notifications: Notification[] = [];
  showNotificationPanel = false;

  menuItems = [
    // { label: 'Profile', icon: 'pi pi-user' },
    // { label: 'Settings', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() },
  ];

  constructor(
    public auth: AuthService,
    private router: Router,
    private headerService: HeaderService,
    public theme: ThemeService,
    public roleService: RoleService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadNavData();
    this.trackActiveRoute();
    this.initializeNotifications();
  }

  loadNavData(): void {
    this.headerService.getNavData().subscribe({
      next: (data) => {
        this.navItems = data.navItems;
        this.brand = data.brand;
      },
      error: (err) => console.error('Failed to load nav data:', err),
    });
  }

  trackActiveRoute(): void {
    this.activeRoute = this.router.url;
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) {
        this.isRouteLoading = true;
        this.cdr.markForCheck();
      }
      if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        this.isRouteLoading = false;
        if (e instanceof NavigationEnd) {
          this.activeRoute = e.urlAfterRedirects;
          this.closeMobileMenu();
        }
        this.cdr.markForCheck();
      }
    });
  }

  isActive(route: string): boolean {
    return this.activeRoute === route || this.activeRoute.startsWith(route + '/');
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 10;
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  getInitials(user: User | null | undefined): string {
    if (!user) return '?';
    if (user.name)
      return user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    return user.email ? user.email[0].toUpperCase() : '?';
  }

  getIconSvg(icon: string): string {
    const icons: Record<string, string> = {
      home: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
      clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      timer: `<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 3h6"/><path d="M12 3v2"/>`,
      'layout-template': `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>`,
      'bar-chart-2': `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
      'help-circle': `<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
      shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
    };
    return icons[icon] || '';
  }

  // ── Notification handlers ───────────────────────────────────────────────────

  private initializeNotifications(): void {
    this.notifications = [
      {
        id: 1,
        title: 'Timesheet Reminder',
        message: 'Submit your timesheet for the week of April 14-18.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        type: 'warning',
      },
      {
        id: 2,
        title: 'Timesheet Approved',
        message: 'Your timesheet for week April 7-11 has been approved.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true,
        type: 'success',
      },
      {
        id: 3,
        title: 'Leave Request Update',
        message: 'Your leave request for April 23-25 requires approval.',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: false,
        type: 'info',
      },
      {
        id: 4,
        title: 'Project Update',
        message: 'i2e Internal Portal project status changed to Active.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        read: true,
        type: 'info',
      },
      {
        id: 5,
        title: 'System Maintenance',
        message: 'Scheduled maintenance on April 28 from 2:00 PM to 4:00 PM.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        read: true,
        type: 'warning',
      },
    ];
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  toggleNotificationPanel(): void {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.cdr.markForCheck();
  }

  markNotificationAsRead(notification: Notification): void {
    notification.read = true;
    this.cdr.markForCheck();
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      info: 'pi-info-circle',
      warning: 'pi-exclamation-triangle',
      success: 'pi-check-circle',
      error: 'pi-times-circle',
    };
    return icons[type] || 'pi-info-circle';
  }

  formatNotificationTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }
}
