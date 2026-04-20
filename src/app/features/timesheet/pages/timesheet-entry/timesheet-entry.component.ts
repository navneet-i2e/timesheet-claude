import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  DashboardHomeService,
  TimesheetJsonData,
  RawWeekDay,
} from '../../../../core/services/dashboard-home';
import { RoleService } from '../../../../core/services/role.service';
import { PunchService } from '../../../../core/services/punch.service';

export interface EntryRow {
  projectId: string;
  categoryId: string;
  description: string;
  hours: Record<string, number>;
}

@Component({
  selector: 'app-timesheet-entry',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    SelectModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './timesheet-entry.component.html',
  styleUrls: ['./timesheet-entry.component.css'],
})
export class TimesheetEntryComponent implements OnInit {
  loading = true;
  data: TimesheetJsonData | null = null;
  projects: { label: string; value: string }[] = [];
  categories: { label: string; value: string }[] = [];
  weekDays: RawWeekDay[] = [];
  rows: EntryRow[] = [];
  status: 'draft' | 'pending' | 'approved' | 'rejected' = 'draft';

  pendingDates: string[] = [];
  currentPendingIndex = 0;
  selectedDate: string | null = null;

  readonly REQUIRED_DAILY_HOURS = 8.5;
  readonly DAILY_MAX_HOURS = 24;

  constructor(
    private svc: DashboardHomeService,
    public roleService: RoleService,
    public punchService: PunchService,
    private msgSvc: MessageService,
    public cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.pendingDates = this.generatePendingDates();

    this.route.params.subscribe((params) => {
      if (params['date']) {
        this.selectedDate = params['date'];
        this.currentPendingIndex = this.pendingDates.indexOf(this.selectedDate || '');
      } else {
        this.selectedDate = this.pendingDates[0];
        this.currentPendingIndex = 0;
      }
      this.loadTimesheetData();
    });
  }

  private generatePendingDates(): string[] {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() - i * 7);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }

  private loadTimesheetData(): void {
    this.svc.getRawData().subscribe({
      next: (d) => {
        this.data = d;

        // Use real projects from JSON, plus dummy fallbacks if empty
        this.projects = d.projects.length > 0
          ? d.projects.map((p) => ({ label: p.name, value: p.id }))
          : [
              { label: 'i2e Consulting Internal', value: 'proj-1' },
              { label: 'Client Portal - Axis Bank', value: 'proj-2' },
              { label: 'TalentBridge Platform', value: 'proj-3' },
              { label: 'Infrastructure & DevOps', value: 'proj-4' },
              { label: 'R&D / Innovation Sprint', value: 'proj-5' },
            ];

        // Use real categories from JSON, plus dummy fallbacks if empty
        this.categories = d.taskCategories.length > 0
          ? d.taskCategories.map((c) => ({ label: c.label, value: c.id }))
          : [
              { label: 'Development', value: 'cat-1' },
              { label: 'Testing / QA', value: 'cat-2' },
              { label: 'Code Review', value: 'cat-3' },
              { label: 'Meetings & Calls', value: 'cat-4' },
              { label: 'Documentation', value: 'cat-5' },
              { label: 'Deployment', value: 'cat-6' },
              { label: 'Bug Fix', value: 'cat-7' },
              { label: 'Design / UI', value: 'cat-8' },
            ];

        this.weekDays = d.weekDays;
        this.status = (localStorage.getItem('ts-status') as any) ?? d.timesheetMeta.status;
        this.loadRows();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'Failed to load timesheet data.' });
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

 // 🔧 ONLY CHANGE: loadRows() updated (no unwanted auto population)

private loadRows(): void {
  // 🔧 FIX START: prevent unwanted auto-population
  const stored = localStorage.getItem('ts-entries');

  if (!stored) {
    this.rows = [];
    return;
  }

  // OPTIONAL: restore only if user already worked on it
  try {
    const entries = JSON.parse(stored);
    if (!entries || entries.length === 0) {
      this.rows = [];
      return;
    }

    const groups: Record<string, EntryRow> = {};

    entries.forEach((e: any) => {
      const key = `${e.projectId}||${e.taskCategoryId}`;
      if (!groups[key]) {
        groups[key] = {
          projectId: e.projectId,
          categoryId: e.taskCategoryId,
          description: e.taskDescription,
          hours: {},
        };
      }
      groups[key].hours[e.date] = e.hoursLogged;
    });

    this.rows = Object.values(groups);
  } catch {
    this.rows = [];
  }
  // 🔧 FIX END
}

  addRow(): void {
    const row: EntryRow = { projectId: '', categoryId: '', description: '', hours: {} };
    this.weekDays.forEach((d) => (row.hours[d.date] = 0));
    this.rows = [...this.rows, row];
    this.cdr.markForCheck();
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  prevPendingDate(): void {
    if (this.currentPendingIndex > 0) {
      this.currentPendingIndex--;
      this.selectedDate = this.pendingDates[this.currentPendingIndex];
      this.cdr.markForCheck();
    }
  }

  nextPendingDate(): void {
    if (this.currentPendingIndex < this.pendingDates.length - 1) {
      this.currentPendingIndex++;
      this.selectedDate = this.pendingDates[this.currentPendingIndex];
      this.cdr.markForCheck();
    }
  }

  getHours(row: EntryRow, date: string): number {
    const total = row.hours[date] ?? 0;
    return Math.floor(total);
  }

  getMinutes(row: EntryRow, date: string): number {
    const total = row.hours[date] ?? 0;
    return Math.round((total % 1) * 60);
  }

  setHours(row: EntryRow, date: string, hours: number): void {
  const currentMinutes = this.getMinutes(row, date);
  let total = hours + currentMinutes / 60;

  const currentDayTotalExcludingRow =
    this.getSelectedDayTotalInternal() - (row.hours[date] || 0);

  if (currentDayTotalExcludingRow + total > this.REQUIRED_DAILY_HOURS) {
    this.msgSvc.add({
      severity: 'warn',
      summary: 'Limit Exceeded',
      detail: 'You cannot log more than 8 hours 30 minutes in a day.',
    });
    return;
  }

  row.hours[date] = Math.min(this.DAILY_MAX_HOURS, Math.max(0, total));
  this.cdr.markForCheck();
}
setMinutes(row: EntryRow, date: string, minutes: number): void {
  const currentHours = this.getHours(row, date);
  let total = currentHours + minutes / 60;

  const currentDayTotalExcludingRow =
    this.getSelectedDayTotalInternal() - (row.hours[date] || 0);

  if (currentDayTotalExcludingRow + total > this.REQUIRED_DAILY_HOURS) {
    this.msgSvc.add({
      severity: 'warn',
      summary: 'Limit Exceeded',
      detail: 'You cannot log more than 8 hours 30 minutes in a day.',
    });
    return;
  }

  row.hours[date] = Math.min(this.DAILY_MAX_HOURS, Math.max(0, total));
  this.cdr.markForCheck();
}

  getSelectedDayTotalFormatted(): string {
    if (!this.selectedDate) return '0 hours 0 minutes';

    const totalHours = this.rows.reduce((sum, r) => sum + (r.hours[this.selectedDate!] ?? 0), 0);
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours % 1) * 60);

    let str = '';
    if (hours > 0) str += `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) {
      if (str) str += ' ';
      str += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return str || '0 minutes';
  }

  getSelectedDayTotalInternal(): number {
    if (!this.selectedDate) return 0;
    return this.rows.reduce((sum, r) => sum + (r.hours[this.selectedDate!] ?? 0), 0);
  }

  getHoursRemaining(): string {
    if (!this.selectedDate) return '0h';
    const remaining = this.REQUIRED_DAILY_HOURS - this.getSelectedDayTotalInternal();
    if (remaining <= 0) return '✓ Complete';
    const h = Math.floor(remaining);
    const m = Math.round((remaining % 1) * 60);
    let str = '';
    if (h > 0) str += `${h} hour${h > 1 ? 's' : ''}`;
    if (m > 0) { if (str) str += ' '; str += `${m} minute${m > 1 ? 's' : ''}`; }
    return str || '0 minutes';
  }

  private validate(): string | null {
  const total = this.getSelectedDayTotalInternal();

  if (total === 0) {
    return 'Please log some hours before submitting.';
  }

  if (total > this.REQUIRED_DAILY_HOURS) {
    return 'Please fill timesheet correctly. Total hours cannot exceed 8 hours 30 minutes.';
  }

  for (let i = 0; i < this.rows.length; i++) {
    const r = this.rows[i];
    if (!r.projectId) return `Row ${i + 1}: Please select a project.`;
    if (!r.categoryId) return `Row ${i + 1}: Please select a task category.`;
  }

  return null;
}

  submitTimesheet(): void {
    const error = this.validate();
    if (error) {
      this.msgSvc.add({ severity: 'warn', summary: 'Validation Error', detail: error });
      return;
    }

    this.persist('pending');
    this.status = 'pending';
    this.cdr.markForCheck();

    this.msgSvc.add({
      severity: 'success',
      summary: 'Submitted Successfully',
      detail: 'Your timesheet has been submitted for approval.',
      life: 3000,
    });

    // Navigate to next pending date after a short delay so toast is visible
    setTimeout(() => {
      const nextIndex = this.currentPendingIndex + 1;
      if (nextIndex < this.pendingDates.length) {
        this.currentPendingIndex = nextIndex;
        this.selectedDate = this.pendingDates[nextIndex];
        this.status = 'draft';
        this.loadTimesheetData();
      } else {
        this.router.navigate(['/dashboard']);
      }
    }, 1500);
  }

  private persist(status: string): void {
    const entries: any[] = [];
    this.rows.forEach((r) => {
      Object.entries(r.hours).forEach(([date, h]) => {
        if (h > 0) {
          entries.push({
            projectId: r.projectId,
            taskCategoryId: r.categoryId,
            taskDescription: r.description,
            date,
            hoursLogged: h,
          });
        }
      });
    });

    localStorage.setItem('ts-entries', JSON.stringify(entries));
    localStorage.setItem('ts-status', status);

    console.log('💾 Saved entries:', entries); // for debugging
  }

  dayLabel(wd: RawWeekDay): string {
    return wd.day.substring(0, 3);
  }

  getStatusSev(): 'success' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'warn' | 'danger' | 'secondary'> = {
      approved: 'success',
      pending: 'warn',
      rejected: 'danger',
      draft: 'secondary',
    };
    return map[this.status] || 'secondary';
  }
}
