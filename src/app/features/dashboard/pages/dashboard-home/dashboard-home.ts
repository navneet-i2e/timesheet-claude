import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  DashboardHomeService,
  DashboardViewModel,
  KpiCard,
  ProjectBarItem,
  RawByDay,
  RawByCategory,
} from '../../../../core/services/dashboard-home';
import { PunchService } from '../../../../core/services/punch.service';
import { RoleService } from '../../../../core/services/role.service';
import { ThemeService } from '../../../../core/services/theme.service';

export interface DummyProject {
  code: string;
  name: string;
  client: string;
  selected: boolean;
}

export interface PendingTimesheet {
  id: string;
  weekNumber: number;
  date: string;
  status: 'pending' | 'draft' | 'rejected';
}

const DUMMY_PROJECTS: DummyProject[] = [
  { code: 'PRJ-001', name: 'Phoenix ERP Migration', client: 'Infosys Ltd', selected: false },
  { code: 'PRJ-002', name: 'Falcon API Gateway', client: 'TCS', selected: false },
  { code: 'PRJ-003', name: 'BlueWave CRM', client: 'Wipro', selected: false },
  { code: 'PRJ-004', name: 'Atlas Data Pipeline', client: 'HCL Technologies', selected: false },
  { code: 'PRJ-005', name: 'Nexus Cloud Infra', client: 'Tech Mahindra', selected: false },
  { code: 'PRJ-006', name: 'Horizon Mobile App', client: 'Cognizant', selected: false },
  { code: 'PRJ-007', name: 'Sigma Analytics Dashboard', client: 'Capgemini', selected: false },
  { code: 'PRJ-008', name: 'Orion DevOps Automation', client: 'Accenture', selected: false },
  { code: 'PRJ-009', name: 'Titan Security Audit', client: 'Deloitte', selected: false },
  { code: 'PRJ-010', name: 'Pulse HR Portal', client: 'IBM India', selected: false },
  { code: 'PRJ-011', name: 'Cobalt BI Reports', client: 'SAP Labs', selected: false },
  { code: 'PRJ-012', name: 'Vega Microservices', client: 'Oracle India', selected: false },
  { code: 'PRJ-013', name: 'Aurora IoT Platform', client: 'Siemens India', selected: false },
  { code: 'PRJ-014', name: 'Stratus ML Pipeline', client: 'Google APAC', selected: false },
  { code: 'PRJ-015', name: 'Nova Payment Gateway', client: 'Razorpay', selected: false },
  { code: 'PRJ-016', name: 'Ember Compliance Suite', client: 'KPMG India', selected: false },
  { code: 'PRJ-017', name: 'Solaris Testing Framework', client: 'LTIMindtree', selected: false },
  {
    code: 'PRJ-018',
    name: 'Helix Identity Platform',
    client: 'Persistent Systems',
    selected: false,
  },
];

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ChartModule,
    SkeletonModule,
    TooltipModule,
    TagModule,
    ButtonModule,
    AvatarModule,
    ProgressBarModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ToastModule,
  ],
  templateUrl: './dashboard-home.html',
  styleUrls: ['./dashboard-home.css'],
})
export class DashboardHome implements OnInit, AfterViewInit, OnDestroy {
  vm: DashboardViewModel | null = null;
  loading = true;
  error: string | null = null;

  barChartData: any;
  barChartOptions: any;
  donutChartData: any;
  donutChartOptions: any;

  // Animation state
  animatedKpis: { [title: string]: number } = {};
  barsAnimated = false;

  // Pending Timesheets
  pendingTimesheets: PendingTimesheet[] = [];

  // Project access modal
  showProjectModal = false;
  projectSearch = '';
  allProjects: DummyProject[] = DUMMY_PROJECTS.map((p) => ({ ...p }));

  get filteredProjects(): DummyProject[] {
    const q = this.projectSearch.toLowerCase();
    return q
      ? this.allProjects.filter(
          (p) =>
            p.code.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.client.toLowerCase().includes(q),
        )
      : this.allProjects;
  }

  get selectedCount(): number {
    return this.allProjects.filter((p) => p.selected).length;
  }

  private destroy$ = new Subject<void>();

  constructor(
    private svc: DashboardHomeService,
    public punch: PunchService,
    public roleService: RoleService,
    public theme: ThemeService,
    private router: Router,
    private msgSvc: MessageService,
    private cdr: ChangeDetectorRef,
  ) {
    // Rebuild charts whenever theme changes so colors are always correct
    effect(() => {
      this.theme.theme(); // read the signal to register dependency
      if (this.vm) {
        this.buildBarChart(this.vm.byDay);
        this.buildDonutChart(this.vm.byCategory);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.pendingTimesheets = this.generatePendingTimesheets();
    this.svc
      .getDashboardViewModel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vm) => {
          this.vm = vm;
          this.buildBarChart(vm.byDay);
          this.buildDonutChart(vm.byCategory);
          this.loading = false;
          this.cdr.markForCheck();
          // Trigger KPI count-up after data loads
          setTimeout(() => this.animateKpis(vm.kpis), 100);
        },
        error: () => {
          this.error = 'Failed to load dashboard data.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngAfterViewInit(): void {
    // Trigger bar animations after view is ready
    setTimeout(() => {
      this.barsAnimated = true;
      this.cdr.markForCheck();
    }, 300);
  }

  // Fix #2 — KPI count-up animation
  private animateKpis(kpis: KpiCard[]): void {
    kpis.forEach((kpi) => {
      const raw = parseFloat(String(kpi.value).replace(/[^0-9.]/g, ''));

      // ❌ Skip non-numeric values like "Pending"
      if (isNaN(raw)) {
        return; // <-- IMPORTANT FIX
      }

      const duration = 800;
      const steps = 40;
      const increment = raw / steps;
      let current = 0;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        const eased = raw * (1 - Math.pow(1 - step / steps, 3));
        this.animatedKpis[kpi.title] = Math.round(eased * 10) / 10;

        this.cdr.markForCheck();

        if (step >= steps) {
          this.animatedKpis[kpi.title] = raw;
          clearInterval(interval);
        }
      }, duration / steps);
    });
  }

  // Returns animated value if available, else original
  getKpiDisplayValue(kpi: KpiCard): string | number {
    if (this.animatedKpis[kpi.title] !== undefined) {
      const raw = String(kpi.value);
      const suffix = raw.replace(/[0-9.]/g, '');
      return this.animatedKpis[kpi.title] + suffix;
    }
    return kpi.value;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get tick() {
    return this.theme.isDark() ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)';
  }
  private get grid() {
    return this.theme.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  }
  private get legend() {
    return this.theme.isDark() ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  }

  private buildBarChart(byDay: RawByDay[]): void {
    const labels = byDay.map((d) => d.day.substring(0, 3));
    const hours = byDay.map((d) => d.totalHours);
    this.barChartData = {
      labels,
      datasets: [
        {
          label: 'Hours Logged',
          data: hours,
          backgroundColor: hours.map((h) =>
            h === 0
              ? 'rgba(100,116,139,0.2)'
              : h >= 8.5
                ? 'rgba(99,102,241,0.85)'
                : 'rgba(99,102,241,0.5)',
          ),
          borderColor: hours.map((h) => (h === 0 ? 'rgba(100,116,139,0.4)' : '#6366f1')),
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c: any) => ` ${c.raw}h logged` } },
      },
      scales: {
        x: { grid: { color: this.grid }, ticks: { color: this.tick, font: { size: 11 } } },
        y: {
          grid: { color: this.grid },
          ticks: { color: this.tick, font: { size: 11 }, stepSize: 2 },
          min: 0,
          max: 10,
        },
      },
    };
  }

  private buildDonutChart(byCategory: RawByCategory[]): void {
    const palette = [
      '#6366f1',
      '#22c55e',
      '#f59e0b',
      '#0ea5e9',
      '#a855f7',
      '#ef4444',
      '#14b8a6',
      '#f97316',
    ];

    this.donutChartData = {
      labels: byCategory.map((c) => c.label),
      datasets: [
        {
          data: byCategory.map((c) => c.totalHours),
          backgroundColor: palette.slice(0, byCategory.length),
          borderColor: this.theme.isDark() ? '#111827' : '#ffffff',
          borderWidth: 4,
          hoverOffset: 12,
        },
      ],
    };

    this.donutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: this.legend,
            font: { size: 11 },
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle',
            pointStyleWidth: 12,
            boxWidth: 12,
            boxHeight: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (c: any) => ` ${c.label}: ${c.raw}h`,
          },
        },
      },
    };
  }
  // Static Punch Logic
  isPunchedIn = false;
  isPunchedOut = false;

  punchInTimeStr = '01:00 PM';
  punchOutTimeStr = '10:00 PM';
  totalHours = 9;

  togglePunch(): void {
    if (this.isPunchedOut) return;

    if (!this.isPunchedIn) {
      this.isPunchedIn = true;
      this.msgSvc.add({
        severity: 'success',
        summary: 'Punched In',
        detail: 'Attendance marked at 01:00 PM',
      });
    } else {
      this.isPunchedIn = false;
      this.isPunchedOut = true;
      this.msgSvc.add({
        severity: 'success',
        summary: 'Punched Out',
        detail: 'Worked 9 hrs today (01:00 PM - 10:00 PM)',
      });
    }
    this.cdr.markForCheck();
  }
  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
    return (
      ({ approved: 'success', pending: 'warn', rejected: 'danger', draft: 'secondary' } as any)[
        status
      ] ?? 'secondary'
    );
  }
  // PrimeNG Icons for KPI Cards
  getKpiIconClass(icon: KpiCard['icon']): string[] {
    switch (icon) {
      case 'clock':
        return ['pi', 'pi-clock'];
      case 'briefcase':
        return ['pi', 'pi-briefcase'];
      case 'file':
        return ['pi', 'pi-file'];
      case 'chart':
        return ['pi', 'pi-chart-bar'];
      default:
        return ['pi', 'pi-clock'];
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getIconSvg(icon: KpiCard['icon']): string {
    const map: Record<string, string> = {
      clock: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
      briefcase: `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>`,
      file: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
      chart: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
    };
    return map[icon] ?? '';
  }

  getTrendIcon(trend: number): string {
    if (trend > 0) return `<polyline points="18 15 12 9 6 15"/>`;
    if (trend < 0) return `<polyline points="6 9 12 15 18 9"/>`;
    return `<line x1="5" y1="12" x2="19" y2="12"/>`;
  }

  getTrendClass(trend: number, icon: KpiCard['icon']): string {
    if (icon === 'file') return 'trend-neutral';
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  }

  trackByProject(_: number, item: ProjectBarItem): string {
    return item.name;
  }
  trackByKpi(_: number, item: KpiCard): string {
    return item.title;
  }
  trackByCode(_: number, item: DummyProject): string {
    return item.code;
  }

  goToPunch(): void {
    this.router.navigate(['/punch']);
  }
  goToReport(): void {
    this.router.navigate(['/report']);
  }
  goToTimesheetEntry(): void {
    this.router.navigate(['/timesheet']);
  }

  // ── Pending Timesheets ─────────────────────────────────────────────────────
  private generatePendingTimesheets(): PendingTimesheet[] {
    const timesheets: PendingTimesheet[] = [];
    const today = new Date();
    const statuses: Array<'pending' | 'draft' | 'rejected'> = ['pending', 'draft', 'rejected'];

    // Generate 3-5 pending timesheets for past weeks
    for (let i = 1; i <= 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - i * 7);
      const dateStr = weekStart.toISOString().split('T')[0];
      const weekNum = this.getWeekNumber(weekStart);

      timesheets.push({
        id: `ts-${i}`,
        weekNumber: weekNum,
        date: dateStr,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }

    return timesheets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  goToTimesheetOnDate(date: string): void {
    // Format date to YYYY-MM-DD if needed
    const formattedDate = date.includes('-') ? date : new Date(date).toISOString().split('T')[0];
    this.router.navigate(['/timesheet', formattedDate]);
  }

  // ── Project Access Modal ───────────────────────────────────────────────────
  openProjectModal(): void {
    this.projectSearch = '';
    this.showProjectModal = true;
  }

  openAdminProjectModal(): void {
    this.router.navigate(['/admin/projects']);
  }
  requestProjectAccess(): void {
    const selected = this.allProjects.filter((p) => p.selected);
    if (selected.length === 0) {
      this.msgSvc.add({
        severity: 'warn',
        summary: 'No Projects Selected',
        detail: 'Please select at least one project.',
      });
      return;
    }
    this.msgSvc.add({
      severity: 'success',
      summary: 'Request Submitted',
      detail: `Access requested for ${selected.length} project(s). Your manager will be notified.`,
    });
    // Reset selections after request
    this.allProjects.forEach((p) => (p.selected = false));
    this.showProjectModal = false;
  }

  clearProjectSearch(): void {
    this.projectSearch = '';
  }
}