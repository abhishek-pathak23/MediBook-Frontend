import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RecordService } from '../../../core/services/record.service';
import { ProviderService } from '../../../core/services/provider.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { MedicalRecord } from '../../../core/models/record.model';
import { Appointment } from '../../../core/models/appointment.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-patient-records',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-header">
      <h2>Patient Records</h2>
      <p>Create and manage medical records for completed appointments</p>
    </div>

    <h3 class="mb-4">Completed Appointments</h3>

    @if (loading) {
      <div class="card" style="text-align:center; padding:32px; color:var(--text-muted)">
        <p style="font-size:1.5rem">⏳</p>
        <p>Loading appointments...</p>
      </div>
    } @else if (filteredAppts.length === 0) {
      <div class="empty-state glass-panel mb-6">
        <div class="icon">📋</div>
        <p>No completed appointments yet.</p>
        <p class="text-muted" style="font-size:0.85rem">
          Go to <strong>Appointments</strong> and mark one as <strong>Complete</strong> first.
        </p>
      </div>
    } @else {
      <div class="flex flex-col gap-3 mb-6">
        @for (a of filteredAppts; track a.appointmentId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ a.serviceType }}</h4>
                <p class="text-muted" style="font-size:0.85rem;">
                  📅 {{ a.appointmentDate }} &middot; 🕐 {{ a.startTime }} &middot; 👤 Patient #{{ a.patientId }} &middot; 🏥 {{ a.modeOfConsultation }}
                </p>
              </div>
              <div class="flex gap-2 items-center">
                <span class="badge badge-success">Completed</span>
                <button class="btn btn-primary btn-sm"
                        (click)="selectAppointment(a)"
                        [id]="'add-record-' + a.appointmentId">
                  {{ selectedAppt?.appointmentId === a.appointmentId ? '✏️ Editing...' : '+ Add Record' }}
                </button>
              </div>
            </div>

            @if (selectedAppt?.appointmentId === a.appointmentId) {
              <div class="animate-in" style="margin-top:16px; padding-top:16px; border-top: 1px solid #334155;">
                <div class="grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">Diagnosis *</label>
                    <textarea class="form-control" [(ngModel)]="newRec.diagnosis" rows="3"
                              placeholder="e.g. Viral fever, Hypertension..." id="diagnosis"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prescription</label>
                    <textarea class="form-control" [(ngModel)]="newRec.prescription" rows="3"
                              placeholder="e.g. Paracetamol 500mg twice daily..." id="prescription"></textarea>
                  </div>
                </div>
                <div class="grid-2 gap-4 mt-3">
                  <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" [(ngModel)]="newRec.notes" rows="2"
                              placeholder="Additional clinical observations..." id="record-notes"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Follow-up Date</label>
                    <input class="form-control" type="date" [(ngModel)]="newRec.followUpDate" id="followup-date" 
                           [min]="selectedAppt?.appointmentDate" />
                  </div>
                </div>
                <div class="form-group mt-3">
                  <label class="form-label">Attachment URL (Optional)</label>
                  <input class="form-control" type="url" [(ngModel)]="newRec.attachmentUrl" 
                         placeholder="e.g. https://s3.amazonaws.com/lab-report.pdf" id="attachment-url" />
                  <small class="text-muted">Link to external lab results or X-rays</small>
                </div>
                <div class="flex gap-3 mt-4">
                  <button class="btn btn-primary" (click)="createRecord()" id="create-record-btn">✓ Save Record</button>
                  <button class="btn btn-ghost" (click)="cancelSelection()">✕ Cancel</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }

    <h3 class="mb-4">Records Created by You</h3>
    @if (records.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">📄</div><p>No records yet</p></div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (r of records; track r.recordId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ r.diagnosis }}</h4>
                <p class="text-muted" style="font-size:0.85rem;">
                  👤 Patient #{{ r.patientId }} &middot; 📋 Appt #{{ r.appointmentId }} &middot; {{ r.createdAt | date:'mediumDate' }}
                </p>
                @if (r.prescription) {
                  <p class="text-muted" style="font-size:0.8rem; margin-top:4px;">💊 {{ r.prescription }}</p>
                }
                @if (r.followUpDate) {
                  <p class="text-muted" style="font-size:0.8rem;">📅 Follow-up: {{ r.followUpDate | date:'mediumDate' }}</p>
                }
                @if (r.attachmentUrl) {
                  <div style="margin-top:8px;">
                    <a [href]="r.attachmentUrl" target="_blank" class="badge badge-accent" style="text-decoration:none;">
                      📎 View Attachment
                    </a>
                  </div>
                }
              </div>
              <div class="flex gap-2 items-center">
                <span class="badge badge-info">Record #{{ r.recordId }}</span>
                <button class="btn btn-outline btn-sm" (click)="editRecord(r)">
                  {{ editingRecordId === r.recordId ? '✏️ Editing...' : 'Edit' }}
                </button>
              </div>
            </div>

            @if (editingRecordId === r.recordId) {
              <div class="animate-in" style="margin-top:16px; padding-top:16px; border-top: 1px solid #334155;">
                <div class="grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label">Diagnosis *</label>
                    <textarea class="form-control" [(ngModel)]="editRec.diagnosis" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prescription</label>
                    <textarea class="form-control" [(ngModel)]="editRec.prescription" rows="3"></textarea>
                  </div>
                </div>
                <div class="grid-2 gap-4 mt-3">
                  <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-control" [(ngModel)]="editRec.notes" rows="2"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Follow-up Date</label>
                    <input class="form-control" type="date" [(ngModel)]="editRec.followUpDate" 
                           [min]="getApptDate(r.appointmentId)" />
                  </div>
                </div>
                <div class="form-group mt-3">
                  <label class="form-label">Attachment URL (Optional)</label>
                  <input class="form-control" type="url" [(ngModel)]="editRec.attachmentUrl" />
                </div>
                <div class="flex gap-3 mt-4">
                  <button class="btn btn-primary" (click)="updateRecord(r.recordId)">✓ Update Record</button>
                  <button class="btn btn-ghost" (click)="cancelEdit()">✕ Cancel</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `
})
export class PatientRecordsComponent implements OnInit {
  private auth = inject(AuthService);
  private recordService = inject(RecordService);
  private providerService = inject(ProviderService);
  private apptService = inject(AppointmentService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  providerId = 0;
  records: MedicalRecord[] = [];
  completedAppts: Appointment[] = [];
  filteredAppts: Appointment[] = [];
  selectedAppt: Appointment | null = null;
  loading = true;
  newRec = { diagnosis: '', prescription: '', notes: '', followUpDate: '', attachmentUrl: '' };
  
  editingRecordId: number | null = null;
  editRec = { diagnosis: '', prescription: '', notes: '', followUpDate: '', attachmentUrl: '' };

  ngOnInit(): void {
    this.providerService.getMyProfile(this.auth.getUserId()).subscribe({
      next: p => {
        if (p) {
          this.providerId = p.providerId;
          this.loadRecords();
          this.loadCompletedAppts();
        } else {
          this.loading = false;
          this.cd.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  loadCompletedAppts(): void {
    this.apptService.getByProvider(this.providerId).subscribe({
      next: all => {
        this.completedAppts = all.filter(a => a.status === 'Completed');
        this.updateFilteredAppts();
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  loadRecords(): void {
    this.recordService.getByProvider(this.providerId).subscribe({
      next: d => {
        this.records = d;
        this.updateFilteredAppts();
        this.cd.detectChanges();
      }
    });
  }

  updateFilteredAppts(): void {
    const recordApptIds = new Set(this.records.map(r => r.appointmentId));
    this.filteredAppts = this.completedAppts.filter(a => !recordApptIds.has(a.appointmentId));
  }

  getApptDate(apptId: number): string {
    const appt = this.completedAppts.find(a => a.appointmentId === apptId);
    return appt ? appt.appointmentDate : '';
  }

  selectAppointment(appt: Appointment): void {
    if (this.selectedAppt?.appointmentId === appt.appointmentId) {
      this.cancelSelection();
      return;
    }
    this.selectedAppt = appt;
    this.cancelEdit();
    this.newRec = { diagnosis: '', prescription: '', notes: '', followUpDate: '', attachmentUrl: '' };
  }

  cancelSelection(): void {
    this.selectedAppt = null;
    this.newRec = { diagnosis: '', prescription: '', notes: '', followUpDate: '', attachmentUrl: '' };
  }

  editRecord(r: MedicalRecord): void {
    this.cancelSelection();
    this.editingRecordId = r.recordId;
    this.editRec = {
      diagnosis: r.diagnosis,
      prescription: r.prescription,
      notes: r.notes || '',
      followUpDate: r.followUpDate ? r.followUpDate.split('T')[0] : '',
      attachmentUrl: r.attachmentUrl || ''
    };
  }

  cancelEdit(): void {
    this.editingRecordId = null;
    this.editRec = { diagnosis: '', prescription: '', notes: '', followUpDate: '', attachmentUrl: '' };
  }

  createRecord(): void {
    if (!this.selectedAppt || !this.newRec.diagnosis.trim()) {
      this.toast.error('Please fill in the Diagnosis field.');
      return;
    }
    if (this.newRec.followUpDate) {
      const apptDate = new Date(this.selectedAppt.appointmentDate);
      const followUpDate = new Date(this.newRec.followUpDate);
      if (followUpDate < apptDate) {
        this.toast.error('Follow-up date cannot be before the appointment date.');
        return;
      }
    }

    this.recordService.create({
      appointmentId: this.selectedAppt.appointmentId,
      patientId: this.selectedAppt.patientId,
      providerId: this.providerId,
      diagnosis: this.newRec.diagnosis,
      prescription: this.newRec.prescription,
      notes: this.newRec.notes || undefined,
      followUpDate: this.newRec.followUpDate || undefined,
      attachmentUrl: this.newRec.attachmentUrl || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Medical record created successfully!');
        this.cancelSelection();
        this.loadRecords();
      },
      error: e => this.toast.error(e.error?.message || 'Failed to create record')
    });
  }

  updateRecord(id: number): void {
    if (!this.editRec.diagnosis.trim()) {
      this.toast.error('Please fill in the Diagnosis field.');
      return;
    }
    
    if (this.editRec.followUpDate) {
      const record = this.records.find(r => r.recordId === id);
      const appt = this.completedAppts.find(a => a.appointmentId === record?.appointmentId);
      if (appt) {
        const apptDate = new Date(appt.appointmentDate);
        const followUpDate = new Date(this.editRec.followUpDate);
        if (followUpDate < apptDate) {
          this.toast.error('Follow-up date cannot be before the appointment date.');
          return;
        }
      }
    }

    this.recordService.update(id, {
      diagnosis: this.editRec.diagnosis,
      prescription: this.editRec.prescription,
      notes: this.editRec.notes || undefined,
      followUpDate: this.editRec.followUpDate || undefined,
      attachmentUrl: this.editRec.attachmentUrl || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Medical record updated successfully!');
        this.cancelEdit();
        this.loadRecords();
      },
      error: e => this.toast.error(e.error?.message || 'Failed to update record')
    });
  }
}
