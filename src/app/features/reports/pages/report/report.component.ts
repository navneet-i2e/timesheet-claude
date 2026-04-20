import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { ChartModule }       from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { ButtonModule }      from 'primeng/button';
import { SelectModule }      from 'primeng/select';

import { TagModule }         from 'primeng/tag';
import { SkeletonModule }    from 'primeng/skeleton';
import { TableModule }       from 'primeng/table';
import { TooltipModule }     from 'primeng/tooltip';

import { DashboardHomeService, TimesheetJsonData, RawByDay, RawProject } from '../../../../core/services/dashboard-home';
import { ExportService } from '../../../../core/services/export.service';
import { RoleService } from '../../../../core/services/role.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-report',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    ChartModule, ButtonModule, SelectModule, CardModule,
    TagModule, SkeletonModule, TableModule, TooltipModule
  ],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit, OnDestroy {
  loading = true;
  rawData: TimesheetJsonData | null = null;
  private destroy$ = new Subject<void>();

  // Filter
  selectedPeriod = 'week';
  periodOptions = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: 'quarter' }
  ];

  // Charts
  hoursBarData: any;   hoursBarOpts: any;
  categoryDonut: any;  categoryDonutOpts: any;
  projectRadar: any;   projectRadarOpts: any;
  trendLine: any;      trendLineOpts: any;

  // Table
  tableData: any[] = [];

  // Summary KPIs
  totalHours = 0;
  billableHours = 0;
  utilization = 0;
  avgPerDay = 0;

  constructor(
    private svc: DashboardHomeService,
    public exportSvc: ExportService,
    public roleService: RoleService,
    public theme: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    // Rebuild charts when theme changes
    effect(() => {
      // Read the theme signal to track changes
      this.theme.theme();
      // Rebuild all charts with new theme colors
      if (this.rawData) {
        this.buildAll(this.rawData);
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.svc.getRawData().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => {
        this.rawData = data;
        this.buildAll(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private get tick(): string { return this.theme.isDark() ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.55)'; }
  private get grid(): string { return this.theme.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'; }
  private get legend(): string { return this.theme.isDark() ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'; }

  buildAll(data: TimesheetJsonData): void {
    this.buildSummary(data);
    this.buildHoursBar(data.summary.byDay);
    this.buildCategoryDonut(data.summary.byCategory);
    this.buildProjectRadar(data);
    this.buildTrendLine(data.summary.byDay);
    this.buildTable(data);
  }

  private buildSummary(data: TimesheetJsonData): void {
    this.totalHours    = data.timesheetMeta.totalHoursLogged;
    this.billableHours = data.summary.byCategory.slice(0, 3).reduce((s, c) => s + c.totalHours, 0);
    this.utilization   = Math.round((this.totalHours / data.timesheetMeta.totalHoursRequired) * 100);
    const workDays     = data.summary.byDay.filter(d => d.totalHours > 0).length || 1;
    this.avgPerDay     = parseFloat((this.totalHours / workDays).toFixed(1));
  }

  private buildHoursBar(byDay: RawByDay[]): void {
    const palette = ['#6366f1','#818cf8','#6366f1','#4f46e5','#818cf8','#6366f1','#4f46e5'];
    this.hoursBarData = {
      labels: byDay.map(d => d.day.substring(0,3)),
      datasets: [{
        label: 'Hours Logged',
        data: byDay.map(d => d.totalHours),
        backgroundColor: palette,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
    this.hoursBarOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c: any) => ` ${c.raw}h` } } },
      scales: {
        x: { grid: { color: this.grid }, ticks: { color: this.tick, font: { size: 12 } } },
        y: { grid: { color: this.grid }, ticks: { color: this.tick, stepSize: 2 }, min: 0, max: 10,
             title: { display: true, text: 'Hours', color: this.tick, font: { size: 11 } } }
      }
    };
  }

  private buildCategoryDonut(cats: any[]): void {
    const palette = ['#6366f1','#22c55e','#f59e0b','#0ea5e9','#a855f7','#ef4444','#14b8a6'];
    this.categoryDonut = {
      labels: cats.map(c => c.label),
      datasets: [{ data: cats.map(c => c.totalHours), backgroundColor: palette, borderWidth: 0, hoverOffset: 10 }]
    };
    this.categoryDonutOpts = {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: this.legend, padding: 16, usePointStyle: true, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c: any) => ` ${c.label}: ${c.raw}h` } }
      }
    };
  }

  private buildProjectRadar(data: TimesheetJsonData): void {
    const byProject = data.summary.byProject;
    this.projectRadar = {
      labels: byProject.map(p => p.projectName.split(' ').slice(0,2).join(' ')),
      datasets: [
        {
          label: 'Hours Logged',
          data: byProject.map(p => p.totalHours),
          backgroundColor: 'rgba(99,102,241,0.2)',
          borderColor: '#6366f1',
          pointBackgroundColor: '#6366f1',
          pointRadius: 5
        },
        {
          label: 'Target Hours',
          data: byProject.map(_ => 15),
          backgroundColor: 'rgba(34,197,94,0.1)',
          borderColor: '#22c55e',
          pointBackgroundColor: '#22c55e',
          pointRadius: 3,
          borderDash: [5, 5]
        }
      ]
    };
    this.projectRadarOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: this.legend, font: { size: 11 } } } },
      scales: {
        r: {
          grid: { color: this.grid },
          pointLabels: { color: this.tick, font: { size: 11 } },
          ticks: { color: this.tick, backdropColor: 'transparent', font: { size: 10 } },
          angleLines: { color: this.grid }
        }
      }
    };
  }

  private buildTrendLine(byDay: RawByDay[]): void {
    const cumulative: number[] = [];
    let sum = 0;
    byDay.forEach(d => { sum += d.totalHours; cumulative.push(parseFloat(sum.toFixed(1))); });
    const target = byDay.map((_, i) => parseFloat(((i + 1) * 8).toFixed(0)));

    this.trendLine = {
      labels: byDay.map(d => d.day.substring(0,3)),
      datasets: [
        {
          label: 'Actual (cumulative)',
          data: cumulative,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#6366f1'
        },
        {
          label: 'Target',
          data: target,
          borderColor: '#22c55e',
          borderDash: [6, 4],
          fill: false,
          tension: 0,
          pointRadius: 0
        }
      ]
    };
    this.trendLineOpts = {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: this.legend, font: { size: 11 } } },
                 tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { color: this.grid }, ticks: { color: this.tick } },
        y: { grid: { color: this.grid }, ticks: { color: this.tick },
             title: { display: true, text: 'Hours', color: this.tick } }
      }
    };
  }

  private buildTable(data: TimesheetJsonData): void {
    const projMap: Record<string, string> = {};
    data.projects.forEach(p => projMap[p.id] = p.name);
    const catMap: Record<string, string> = {};
    data.taskCategories.forEach(c => catMap[c.id] = c.label);

    this.tableData = data.timesheetEntries.map(e => ({
      date: e.date,
      project: projMap[e.projectId] || e.projectId,
      category: catMap[e.taskCategoryId] || e.taskCategoryId,
      task: e.taskDescription,
      hours: e.hoursLogged
    }));
  }

  // ── Export ───────────────────────────────────────────────────
  exportExcel(): void {
    this.exportSvc.exportToExcel(this.tableData, 'timesheet-report');
  }

  exportPDF(): void {
    const kpiHtml = `
      <div class="summary">
        <div class="kpi"><div class="kpi-val">${this.totalHours}h</div><div class="kpi-label">Total Hours</div></div>
        <div class="kpi"><div class="kpi-val">${this.billableHours}h</div><div class="kpi-label">Billable Hours</div></div>
        <div class="kpi"><div class="kpi-val">${this.utilization}%</div><div class="kpi-label">Utilization</div></div>
        <div class="kpi"><div class="kpi-val">${this.avgPerDay}h</div><div class="kpi-label">Avg / Day</div></div>
      </div>
    `;
    const tableHtml = `
      <table>
        <thead><tr>
          <th>Date</th><th>Project</th><th>Category</th><th>Task</th><th>Hours</th>
        </tr></thead>
        <tbody>
          ${this.tableData.map(r => `
            <tr><td>${r.date}</td><td>${r.project}</td><td>${r.category}</td>
                <td>${r.task}</td><td>${r.hours}h</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
    this.exportSvc.exportToPDF('Timesheet Report', kpiHtml + tableHtml);
  }

  onPeriodChange(): void {
    if (this.rawData) this.buildAll(this.rawData);
  }

  totalTableHours(): number {
    return this.tableData.reduce((s, r) => s + r.hours, 0);
  }
}
