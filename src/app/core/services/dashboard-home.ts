import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';

// ── Raw JSON shapes ────────────────────────────────────────────────────────────
export interface RawUser {
  id: string; name: string; designation: string;
  employeeCode: string; email: string; avatar: string;
  department: string; reportingManager: string;
}
export interface RawTimesheetMeta {
  weekStartDate: string; weekEndDate: string;
  weekNumber: number; year: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedOn: string | null; approvedOn: string | null; approvedBy: string | null;
  totalHoursRequired: number; totalHoursLogged: number; comments: string;
}
export interface RawProject {
  id: string; name: string; code: string; client: string; color: string;
}
export interface RawTaskCategory { id: string; label: string; }
export interface RawWeekDay {
  day: string; date: string; isHoliday: boolean; isWeekend: boolean;
}
export interface RawTimesheetEntry {
  id: string; projectId: string; taskCategoryId: string;
  taskDescription: string; date: string; hoursLogged: number; isEditable: boolean;
}
export interface RawByDay    { date: string; day: string; totalHours: number; }
export interface RawByProject { projectId: string; projectName: string; totalHours: number; }
export interface RawByCategory { categoryId: string; label: string; totalHours: number; }
export interface RawSummary {
  byDay: RawByDay[]; byProject: RawByProject[]; byCategory: RawByCategory[];
}
export interface RawHoliday { date: string; name: string; }
export interface TimesheetJsonData {
  user: RawUser; timesheetMeta: RawTimesheetMeta; projects: RawProject[];
  taskCategories: RawTaskCategory[]; weekDays: RawWeekDay[];
  timesheetEntries: RawTimesheetEntry[]; summary: RawSummary; holidays: RawHoliday[];
}

// ── View-model shapes ─────────────────────────────────────────────────────────
export interface KpiCard {
  title: string; value: string; subtitle: string;
  trend: number; trendLabel: string;
  icon: 'clock' | 'briefcase' | 'file' | 'chart';
  colorClass: 'kpi-blue' | 'kpi-purple' | 'kpi-amber' | 'kpi-green';
}
export interface ProjectBarItem {
  name: string; client: string; color: string;
  totalHours: number; requiredHours: number; pct: number; overrun: boolean;
}
export interface DashboardViewModel {
  user: RawUser; meta: RawTimesheetMeta;
  kpis: KpiCard[]; projectBars: ProjectBarItem[];
  byDay: RawByDay[]; byCategory: RawByCategory[];
  timesheetPeriodLabel: string; pendingDates: string[];
  projects: RawProject[];
}

@Injectable({ providedIn: 'root' })
export class DashboardHomeService {
  private readonly DATA_URL = 'assets/data/timesheet-data.json';

  // Singleton cache — fetched once, replayed on every subscription
  private rawData$: Observable<TimesheetJsonData> | null = null;

  constructor(private http: HttpClient) {}

  getRawData(): Observable<TimesheetJsonData> {
    if (!this.rawData$) {
      this.rawData$ = this.http
        .get<TimesheetJsonData>(this.DATA_URL)
        .pipe(shareReplay(1));
    }
    return this.rawData$;
  }

  getDashboardViewModel(): Observable<DashboardViewModel> {
    return this.getRawData().pipe(map(d => this.transform(d)));
  }

  private transform(d: TimesheetJsonData): DashboardViewModel {
    const { user, timesheetMeta: meta, projects, summary } = d;

    const utilizationPct = meta.totalHoursRequired > 0
      ? ((meta.totalHoursLogged / meta.totalHoursRequired) * 100).toFixed(1) + '%'
      : '0%';

    const kpis: KpiCard[] = [
      {
        title: 'Hours Logged',
        value: `${meta.totalHoursLogged}h`,
        subtitle: `of ${meta.totalHoursRequired}h required`,
        trend: +(((meta.totalHoursLogged - meta.totalHoursRequired) / meta.totalHoursRequired) * 100).toFixed(1),
        trendLabel: 'vs target', icon: 'clock', colorClass: 'kpi-blue'
      },
      {
        title: 'Projects Active',
        value: `${projects.length}`,
        subtitle: 'this week',
        trend: 0, trendLabel: 'no change', icon: 'briefcase', colorClass: 'kpi-purple'
      },
      {
        title: 'Timesheet Status',
        value: meta.status.charAt(0).toUpperCase() + meta.status.slice(1),
        subtitle: `Week ${meta.weekNumber}, ${meta.year}`,
        trend: 0,
        trendLabel: meta.submittedOn ? `Submitted ${meta.submittedOn}` : 'Not submitted yet',
        icon: 'file', colorClass: 'kpi-amber'
      },
      {
        title: 'Utilization',
        value: utilizationPct,
        subtitle: 'logged vs required',
        trend: +(meta.totalHoursLogged - meta.totalHoursRequired),
        trendLabel: meta.totalHoursLogged >= meta.totalHoursRequired ? 'Target met' : 'Below target',
        icon: 'chart', colorClass: 'kpi-green'
      }
    ];

    const totalProjectHours = summary.byProject.reduce((s, p) => s + p.totalHours, 0) || 1;
    const projectBars: ProjectBarItem[] = summary.byProject.map(bp => {
      const proj = projects.find(p => p.id === bp.projectId);
      const requiredShare = +((bp.totalHours / totalProjectHours) * meta.totalHoursRequired).toFixed(1);
      const maxHours = Math.max(...summary.byProject.map(x => x.totalHours));
      const pct = +((bp.totalHours / maxHours) * 100).toFixed(1);
      return {
        name: bp.projectName, client: proj?.client ?? '',
        color: proj?.color ?? '#6366f1', totalHours: bp.totalHours,
        requiredHours: requiredShare, pct, overrun: bp.totalHours > requiredShare
      };
    });

    const pendingDates = [
      this.formatLabel(meta.weekStartDate),
      this.formatLabel(meta.weekEndDate)
    ];

    return {
      user, meta, kpis, projectBars,
      byDay: summary.byDay, byCategory: summary.byCategory,
      timesheetPeriodLabel: `${this.formatLabel(meta.weekStartDate)} – ${this.formatLabel(meta.weekEndDate)}`,
      pendingDates, projects
    };
  }

  private formatLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
