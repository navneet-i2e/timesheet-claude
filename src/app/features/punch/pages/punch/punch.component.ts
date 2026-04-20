import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule }    from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule }       from 'primeng/tag';
import { TooltipModule }   from 'primeng/tooltip';
import { TableModule }     from 'primeng/table';

import { PunchService, PunchRecord } from '../../../../core/services/punch.service';
import { RoleService } from '../../../../core/services/role.service';

@Component({
  selector: 'app-punch',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TagModule, TooltipModule, TableModule],
  templateUrl: './punch.component.html',
  styleUrls: ['./punch.component.css']
})
export class PunchComponent {
  punchNote = '';

  constructor(
    public punch: PunchService,
    public roleService: RoleService
  ) {}

  doPunchIn(): void {
    this.punch.punchIn(this.punchNote);
    this.punchNote = '';
  }

  doPunchOut(): void {
    this.punch.punchOut();
  }

  get todayFormatted(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  getStatusSeverity(record: PunchRecord): 'success' | 'warn' | 'danger' {
    if (!record.punchOut) return 'warn';
    const h = record.totalHours ?? 0;
    return h >= 8 ? 'success' : h >= 4 ? 'warn' : 'danger';
  }

  getStatusLabel(record: PunchRecord): string {
    if (!record.punchOut) return 'Active';
    const h = record.totalHours ?? 0;
    return h >= 8 ? 'Full Day' : h >= 4 ? 'Half Day' : 'Partial';
  }

  clearHistory(): void {
    if (confirm('Clear all punch history?')) {
      localStorage.removeItem('ts-punch-records');
      location.reload();
    }
  }
}
