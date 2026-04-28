import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { RecordService } from '../../../core/services/record.service';
import { MedicalRecord } from '../../../core/models/record.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-records',
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <h2>Medical Records</h2>
      <p>Your health history at a glance</p>
    </div>
    @if (loading) {
      <div class="empty-state glass-panel"><div class="icon">⏳</div><p>Loading your records...</p></div>
    } @else if (records.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">📋</div><p>No medical records yet</p></div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (rec of records; track rec.recordId) {
          <div class="card animate-in" (click)="expanded = expanded === rec.recordId ? null : rec.recordId" style="cursor:pointer;">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ rec.diagnosis }}</h4>
                <p class="text-muted" style="font-size:0.85rem;">
                  Created: {{ rec.createdAt | date:'mediumDate' }}
                  @if (rec.followUpDate) { &middot; Follow-up: {{ rec.followUpDate }} }
                </p>
              </div>
              <span class="badge badge-info">Record #{{ rec.recordId }}</span>
            </div>
            @if (expanded === rec.recordId) {
              <div class="mt-4" style="border-top:1px solid var(--border);padding-top:16px;">
                <p class="form-label">Prescription</p>
                <p class="text-secondary mb-4">{{ rec.prescription || 'None' }}</p>
                <p class="form-label">Notes</p>
                <p class="text-secondary">{{ rec.notes || 'None' }}</p>
                @if (rec.attachmentUrl) {
                  <div class="mt-4">
                    <p class="form-label">Attachments</p>
                    <a [href]="rec.attachmentUrl" target="_blank" class="badge badge-accent" style="text-decoration:none;">
                      📎 View Document
                    </a>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class MyRecordsComponent implements OnInit {
  private auth = inject(AuthService);
  private recordService = inject(RecordService);
  private cd = inject(ChangeDetectorRef);

  records: MedicalRecord[] = [];
  expanded: number | null = null;
  loading = true;

  ngOnInit(): void {
    this.recordService.getByPatient(this.auth.getUserId()).subscribe({
      next: d => {
        this.records = d;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => { 
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
}
