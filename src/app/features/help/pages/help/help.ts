import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FaqItem { q: string; a: string; open: boolean; }

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './help.html',
  styleUrl: './help.css',
})
export class HelpComponent {
  activeTab: 'faq' | 'contact' = 'faq';
  contactForm = { name: '', email: '', category: '', subject: '', message: '' };
  submitted = false;
  submitting = false;

  categories = [
    'Login / Access Issue', 'Timesheet Submission Problem', 'Project Not Found',
    'Hours Not Saving', 'Approval Workflow', 'Report / Export Issue', 'Other'
  ];

  faqs: FaqItem[] = [
    { q: 'How do I submit my timesheet?', a: 'Go to the Timesheet page, fill in your project, category, task description and hours for each working day. Once all required fields are completed and hours meet the 8 hours 30 minutesh/day minimum, click "Submit". You cannot edit a submitted timesheet until it is rejected.', open: true },
    { q: 'What is the minimum hours required per working day?', a: 'Each working day requires a minimum of 8 hours 30 minutes hours to be logged. Weekends and public holidays are excluded. The system will warn you if any working day has fewer than 8 hours 30 minutes hours before submission.', open: false },
    { q: 'Can I save a timesheet as a draft?', a: 'Yes. Click "Save Draft" at any time. Your entries are saved locally and you can return to complete them later. Draft timesheets are not sent to your manager for approval.', open: false },
    { q: 'How do I use the Autofill 8 hours 30 minutesh feature?', a: 'The "Autofill 8 hours 30 minutes" button automatically distributes 8 hours 30 minutes hours across all working days for each row. If you have multiple rows, hours are split evenly. This is a quick way to fill standard workdays before adjusting individual entries.', open: false },
    { q: "Why can't I see a project in the dropdown?", a: 'Projects are managed by administrators. If a project you work on is missing, please contact your admin or use the "Contact IT Team" tab to raise a request.', open: false },
    { q: 'What happens after I submit my timesheet?', a: 'Your timesheet moves to "Pending" status and is sent to your reporting manager for approval. You will not be able to edit it in this state. Once approved or rejected, you will be notified.', open: false },
    { q: 'Can I edit a submitted timesheet?', a: 'No. Once submitted (Pending status), you cannot edit your timesheet. If changes are needed, ask your manager to reject it — then it returns to Draft status and you can edit and resubmit.', open: false },

  ];

  toggle(item: FaqItem): void { item.open = !item.open; }

  submitContact(): void {
    if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) return;
    this.submitting = true;
    setTimeout(() => { this.submitting = false; this.submitted = true; }, 1200);
  }

  resetContact(): void {
    this.submitted = false;
    this.contactForm = { name: '', email: '', category: '', subject: '', message: '' };
  }
}
