import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../../core/services/role.service';
import { DashboardHomeService, RawProject } from '../../../../core/services/dashboard-home';

const STORAGE_KEY = 'admin-projects';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class AdminProjectsComponent implements OnInit {
  projects: RawProject[] = [];
  showModal = false;
  isEdit = false;
  deleteTarget: RawProject | null = null;
  form: Partial<RawProject> = {};

  readonly COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#3b82f6'];

  constructor(
    public roleService: RoleService,
    private svc: DashboardHomeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.roleService.isAdmin()) return;   // ← Security

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.projects = JSON.parse(stored);
      this.cdr.markForCheck();
    } else {
      this.svc.getRawData().subscribe(d => {
        this.projects = [...d.projects];
        this.save();
        this.cdr.markForCheck();
      });
    }
  }

  openAdd(): void {
    this.isEdit = false;
    this.form = { color: this.COLORS[0] };
    this.showModal = true;
  }

  openEdit(p: RawProject): void {
    this.isEdit = true;
    this.form = { ...p };
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  saveProject(): void {
    if (!this.form.name || !this.form.code || !this.form.client) return;

    if (this.isEdit) {
      this.projects = this.projects.map(p =>
        p.id === this.form.id ? { ...this.form } as RawProject : p
      );
    } else {
      const newP: RawProject = {
        id: 'proj-' + Date.now(),
        name: this.form.name!,
        code: this.form.code!,
        client: this.form.client!,
        color: this.form.color || this.COLORS[0]
      };
      this.projects = [...this.projects, newP];
    }
    this.save();
    this.showModal = false;
    this.cdr.markForCheck();
  }

  confirmDelete(p: RawProject): void { this.deleteTarget = p; }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.projects = this.projects.filter(p => p.id !== this.deleteTarget!.id);
    this.deleteTarget = null;
    this.save();
    this.cdr.markForCheck();
  }

  cancelDelete(): void { this.deleteTarget = null; }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
  }
}
