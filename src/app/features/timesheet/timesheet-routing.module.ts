import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', // ← Default /timesheet
    loadComponent: () =>
      import('./pages/timesheet-entry/timesheet-entry.component').then(
        (m) => m.TimesheetEntryComponent,
      ),
  },
  {
    path: ':date',
    loadComponent: () =>
      import('./pages/timesheet-entry/timesheet-entry.component').then(
        (m) => m.TimesheetEntryComponent,
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TimesheetRoutingModule {}
