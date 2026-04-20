import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { TooltipModule } from 'primeng/tooltip';

interface NavItem { label: string; route: string; icon: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  navItems: NavItem[] = [
    { label: 'Dashboard',  route: '/dashboard', icon: 'home' },
    { label: 'Timesheet',  route: '/timesheet', icon: 'clock' },
    { label: 'Punch',      route: '/punch',      icon: 'timer' },
    { label: 'Reports',    route: '/report',     icon: 'bar-chart-2' },
    { label: 'Template',   route: '/my-template', icon: 'layout-template' },
  ];

  constructor(public auth: AuthService) {}

  getIconSvg(icon: string): string {
    const icons: Record<string, string> = {
      'home':            `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
      'clock':           `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      'timer':           `<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 3h6"/><path d="M12 3v2"/>`,
      'layout-template': `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>`,
      'bar-chart-2':     `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
    };
    return icons[icon] || '';
  }
}
