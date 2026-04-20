import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Public route — no guard
  {
    path: 'login',
    loadChildren: () =>
      import('./features/auth/auth-routing-module')
        .then(m => m.AuthRoutingModule)
  },

  // Default redirect — guard handles unauthenticated users
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // Protected routes — all require authentication
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard-routing-module')
        .then(m => m.DashboardRoutingModule)
  },
  {
    path: 'timesheet',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/timesheet/timesheet-routing.module')
        .then(m => m.TimesheetRoutingModule)
  },
  {
    path: 'report',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/reports/reports-routing.module')
        .then(m => m.ReportsRoutingModule)
  },
  {
    path: 'my-template',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/template/template-routing.module')
        .then(m => m.TemplateRoutingModule)
  },
  {
    path: 'punch',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/punch/punch-routing.module')
        .then(m => m.PunchRoutingModule)
  },
  {
    path:'help',
    canActivate:[authGuard],
    loadChildren:()=>
      import('./features/help/help-routing.module')
        .then(m=>m.HelpRoutingModule)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/admin/admin-routing.module')
        .then(m => m.AdminRoutingModule)
  },

  // Catch-all — also guarded via redirect to dashboard
  { path: '**', redirectTo: 'dashboard' }
];
