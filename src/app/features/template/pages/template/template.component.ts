import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule }   from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule }    from 'primeng/select';
import { TextareaModule }  from 'primeng/textarea';
import { TagModule }       from 'primeng/tag';
import { TooltipModule }   from 'primeng/tooltip';

import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DashboardHomeService } from '../../../../core/services/dashboard-home';
import { RoleService } from '../../../../core/services/role.service';

export interface TimesheetTemplate {
  id: string;
  name: string;
  description: string;
  projectId: string;
  projectName: string;
  categoryId: string;
  categoryName: string;
  taskDescription: string;
  defaultHours: number;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

@Component({
  selector: 'app-template',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule, TextareaModule,
    TagModule, TooltipModule, CardModule, ConfirmDialogModule, ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.css']
})
export class TemplateComponent implements OnInit {
  templates: TimesheetTemplate[] = [];
  projects: { label: string; value: string }[] = [];
  categories: { label: string; value: string }[] = [];

  showForm = false;
  isEditing = false;
  selectedTemplate: TimesheetTemplate | null = null;

  form: Partial<TimesheetTemplate> = {};
  searchQuery = '';

  // Autofill suggestions
  suggestedTemplates: TimesheetTemplate[] = [];
  showSuggestions = false;

  constructor(
    private svc: DashboardHomeService,
    public roleService: RoleService,
    private confirmSvc: ConfirmationService,
    private messageSvc: MessageService
  ) {}

  ngOnInit(): void {
    this.svc.getRawData().subscribe(data => {
      this.projects   = data.projects.map(p => ({ label: p.name, value: p.id }));
      this.categories = data.taskCategories.map(c => ({ label: c.label, value: c.id }));
      this.loadTemplates(data);
    });
  }

  private loadTemplates(data: any): void {
    const stored = localStorage.getItem('ts-templates');
    if (stored) {
      this.templates = JSON.parse(stored);
      return;
    }
    // Seed from existing entries
    const projMap: Record<string, string> = {};
    data.projects.forEach((p: any) => projMap[p.id] = p.name);
    const catMap: Record<string, string> = {};
    data.taskCategories.forEach((c: any) => catMap[c.id] = c.label);

    const seen = new Set<string>();
    this.templates = data.timesheetEntries
      .filter((e: any) => {
        const key = `${e.projectId}-${e.taskCategoryId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6)
      .map((e: any, i: number) => ({
        id:              `tmpl-${i}`,
        name:            `${projMap[e.projectId]} — ${catMap[e.taskCategoryId]}`,
        description:     e.taskDescription,
        projectId:       e.projectId,
        projectName:     projMap[e.projectId],
        categoryId:      e.taskCategoryId,
        categoryName:    catMap[e.taskCategoryId],
        taskDescription: e.taskDescription,
        defaultHours:    e.hoursLogged,
        tags:            [catMap[e.taskCategoryId]],
        usageCount:      Math.floor(Math.random() * 20) + 1,
        createdAt:       new Date().toLocaleDateString('en-CA')
      }));
    this.saveTemplates();
  }

  get filteredTemplates(): TimesheetTemplate[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.templates;
    return this.templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.projectName.toLowerCase().includes(q) ||
      t.taskDescription.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  // ── Autofill ─────────────────────────────────────────────────
  onSearchInput(): void {
    if (this.searchQuery.length < 2) { this.showSuggestions = false; return; }
    const q = this.searchQuery.toLowerCase();
    this.suggestedTemplates = this.templates
      .filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.projectName.toLowerCase().includes(q) ||
        t.taskDescription.toLowerCase().includes(q)
      )
      .slice(0, 5);
    this.showSuggestions = this.suggestedTemplates.length > 0;
  }

  applySuggestion(t: TimesheetTemplate): void {
    this.searchQuery = t.name;
    this.showSuggestions = false;
    this.applyTemplate(t);
  }

  applyTemplate(t: TimesheetTemplate): void {
    // Increment usage
    this.templates = this.templates.map(tmpl =>
      tmpl.id === t.id ? { ...tmpl, usageCount: tmpl.usageCount + 1 } : tmpl
    );
    this.saveTemplates();
    this.form = { ...t };
    this.showForm = true;
    this.isEditing = false;
    this.messageSvc.add({
      severity: 'success', summary: 'Template Applied',
      detail: `"${t.name}" loaded — ready to submit`
    });
  }

  // ── CRUD ─────────────────────────────────────────────────────
  openNewForm(): void {
    this.form = { defaultHours: 8, tags: [] };
    this.isEditing = false;
    this.showForm  = true;
  }

  editTemplate(t: TimesheetTemplate): void {
    this.form      = { ...t };
    this.isEditing = true;
    this.showForm  = true;
  }

  saveForm(): void {
    if (!this.form.name || !this.form.projectId) {
      this.messageSvc.add({ severity: 'warn', summary: 'Missing fields', detail: 'Name and Project are required.' });
      return;
    }
    const proj = this.projects.find(p => p.value === this.form.projectId);
    const cat  = this.categories.find(c => c.value === this.form.categoryId);
    const now  = new Date().toLocaleDateString('en-CA');

    if (this.isEditing && this.form.id) {
      this.templates = this.templates.map(t =>
        t.id === this.form.id
          ? { ...t, ...this.form, projectName: proj?.label || '', categoryName: cat?.label || '' } as TimesheetTemplate
          : t
      );
      this.messageSvc.add({ severity: 'success', summary: 'Saved', detail: 'Template updated.' });
    } else {
      const newT: TimesheetTemplate = {
        id:              `tmpl-${Date.now()}`,
        name:            this.form.name!,
        description:     this.form.description || '',
        projectId:       this.form.projectId!,
        projectName:     proj?.label || '',
        categoryId:      this.form.categoryId || '',
        categoryName:    cat?.label || '',
        taskDescription: this.form.taskDescription || '',
        defaultHours:    this.form.defaultHours || 8,
        tags:            this.form.tags || [],
        usageCount:      0,
        createdAt:       now
      };
      this.templates = [newT, ...this.templates];
      this.messageSvc.add({ severity: 'success', summary: 'Created', detail: 'New template saved.' });
    }
    this.saveTemplates();
    this.showForm = false;
  }

  deleteTemplate(t: TimesheetTemplate): void {
    this.confirmSvc.confirm({
      message: `Delete template "${t.name}"?`,
      header:  'Confirm Delete',
      icon:    'pi pi-trash',
      accept: () => {
        this.templates = this.templates.filter(tmpl => tmpl.id !== t.id);
        this.saveTemplates();
        this.messageSvc.add({ severity: 'info', summary: 'Deleted', detail: 'Template removed.' });
      }
    });
  }

  cancelForm(): void { this.showForm = false; }

  private saveTemplates(): void {
    localStorage.setItem('ts-templates', JSON.stringify(this.templates));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.autofill-input-wrap')) {
      this.showSuggestions = false;
    }
  }
}
