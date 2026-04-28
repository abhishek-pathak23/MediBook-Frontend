import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ProviderService } from '../../../core/services/provider.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment } from '../../../core/models/appointment.model';
import { AvailabilitySlot } from '../../../core/models/schedule.model';
import { SignalRService } from '../../../core/services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-appointment-list',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>Appointments</h2>
      <p>Manage patient appointments</p>
    </div>

    <div class="flex gap-3 mb-6">
      @for (f of filters; track f) {
        <button class="btn btn-sm" [class.btn-primary]="activeFilter===f" [class.btn-ghost]="activeFilter!==f"
                (click)="setFilter(f)">{{ f }}</button>
      }
    </div>

    @if (filtered.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">📅</div><p>No appointments</p></div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (a of filtered; track a.appointmentId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ a.serviceType }}</h4>
                <p class="text-muted" style="font-size:0.85rem;">
                  {{ a.appointmentDate }} · {{ a.startTime }}-{{ a.endTime }} · Patient #{{ a.patientId }}
                </p>
                <div class="flex gap-3 mt-2">
                  <span class="badge badge-accent">{{ a.modeOfConsultation }}</span>
                  <span class="badge"
                        [class.badge-success]="a.status==='Completed'"
                        [class.badge-info]="a.status==='Booked' || a.status==='Scheduled'"
                        [class.badge-warning]="a.status==='Confirmed'"
                        [class.badge-danger]="a.status==='Cancelled'">{{ a.status }}</span>
                </div>
              </div>
              <div class="flex gap-2 flex-wrap" style="justify-content:flex-end;">
                @if (a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Booked') {
                  <button class="btn btn-primary btn-sm" (click)="complete(a.appointmentId)"
                          id="complete-{{a.appointmentId}}">✓ Complete</button>
                  <button class="btn btn-outline btn-sm" (click)="openReschedule(a)"
                          id="reschedule-{{a.appointmentId}}">
                    {{ rescheduleApptId === a.appointmentId ? '✕ Close' : '🗓 Reschedule' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="cancel(a.appointmentId)"
                          id="cancel-{{a.appointmentId}}">Cancel</button>
                }
              </div>
            </div>

            <!-- ── Inline Reschedule Panel ── -->
            @if (rescheduleApptId === a.appointmentId) {
              <div class="animate-in" style="margin-top:16px; padding-top:16px; border-top: 1px solid #334155;">
                <h4 style="margin-bottom:12px;">🗓 Reschedule for Patient #{{ a.patientId }}</h4>

                @if (loadingSlots) {
                  <p class="text-muted" style="font-size:0.85rem;">⏳ Loading your available dates...</p>
                } @else if (availableDates.length === 0) {
                  <div style="padding:12px; background:rgba(239,68,68,0.1); border-radius:8px; color:#ef4444; font-size:0.85rem;">
                    ⚠️ You have no free slots available. Please add more slots to your schedule first.
                  </div>
                } @else {
                  <div class="grid-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">Select a Date</label>
                      <select class="form-control" [(ngModel)]="rescheduleDate"
                              (ngModelChange)="onDateChange()"
                              id="provider-reschedule-date-{{a.appointmentId}}">
                        <option value="">-- {{ availableDates.length }} dates available --</option>
                        @for (d of availableDates; track d) {
                          <option [value]="d">{{ d }}</option>
                        }
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Select a Time Slot</label>
                      @if (!rescheduleDate) {
                        <p class="text-muted" style="font-size:0.85rem; padding-top:8px;">← Pick a date first</p>
                      } @else if (slotsForDate.length === 0) {
                        <p class="text-muted" style="font-size:0.85rem; padding-top:8px;">No slots on this date.</p>
                      } @else {
                        <select class="form-control" [(ngModel)]="selectedSlotId"
                                id="provider-reschedule-slot-{{a.appointmentId}}">
                          <option value="">-- {{ slotsForDate.length }} slots available --</option>
                          @for (slot of slotsForDate; track slot.slotId) {
                            <option [value]="slot.slotId">{{ slot.startTime }} – {{ slot.endTime }}</option>
                          }
                        </select>
                      }
                    </div>
                  </div>
                  <div class="flex gap-3 mt-3">
                    <button class="btn btn-primary btn-sm"
                            [disabled]="!selectedSlotId || isRescheduling"
                            (click)="confirmReschedule(a.appointmentId)"
                            id="confirm-provider-reschedule-{{a.appointmentId}}">
                      {{ isRescheduling ? 'Rescheduling...' : '✓ Confirm Reschedule' }}
                    </button>
                    <button class="btn btn-ghost btn-sm" (click)="closeReschedule()">✕ Cancel</button>
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
export class AppointmentListComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private providerService = inject(ProviderService);
  private scheduleService = inject(ScheduleService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);
  private signalRService = inject(SignalRService);

  appointments: Appointment[] = [];
  filtered: Appointment[] = [];
  filters = ['All', 'Scheduled', 'Confirmed', 'Completed', 'Cancelled'];
  activeFilter = 'All';
  providerId = 0;
  private signalRSub?: Subscription;

  // Reschedule state
  rescheduleApptId: number | null = null;
  allProviderSlots: AvailabilitySlot[] = [];
  availableDates: string[] = [];
  slotsForDate: AvailabilitySlot[] = [];
  rescheduleDate = '';
  selectedSlotId: number | '' = '';
  loadingSlots = false;
  isRescheduling = false;
  today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.providerService.getAll().subscribe({
      next: ps => {
        const p = ps.find(p => p.userId === this.auth.getUserId());
        if (p) { this.providerId = p.providerId; this.load(); }
      }
    });
    this.signalRSub = this.signalRService.dashboardUpdate$.subscribe(() => {
      if (this.providerId > 0) this.load();
    });
  }

  ngOnDestroy(): void {
    if (this.signalRSub) this.signalRSub.unsubscribe();
  }

  load(): void {
    this.apptService.getByProvider(this.providerId).subscribe({
      next: d => { this.appointments = d; this.applyFilter(); this.cd.detectChanges(); }
    });
  }

  setFilter(f: string): void {
    this.activeFilter = f;
    this.applyFilter();
    this.cd.detectChanges();
  }

  private applyFilter(): void {
    this.filtered = this.activeFilter === 'All' ? this.appointments :
      this.appointments.filter(a => a.status === this.activeFilter);
  }

  // ── Reschedule logic ──
  openReschedule(appt: Appointment): void {
    if (this.rescheduleApptId === appt.appointmentId) {
      this.closeReschedule();
      return;
    }
    this.rescheduleApptId = appt.appointmentId;
    this.rescheduleDate = '';
    this.selectedSlotId = '';
    this.slotsForDate = [];
    this.availableDates = [];
    this.allProviderSlots = [];
    this.loadingSlots = true;

    // Fetch provider's own slots, filter to free future ones
    this.scheduleService.getByProvider(this.providerId).subscribe({
      next: (slots) => {
        const today = this.today;
        this.allProviderSlots = slots.filter(s => !s.isBooked && !s.isBlocked && s.date >= today);
        const dateSet = new Set(this.allProviderSlots.map(s => s.date));
        this.availableDates = Array.from(dateSet).sort();
        this.loadingSlots = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loadingSlots = false;
        this.toast.error('Failed to load your available slots.');
        this.cd.detectChanges();
      }
    });
  }

  onDateChange(): void {
    this.selectedSlotId = '';
    this.slotsForDate = this.allProviderSlots.filter(s => s.date === this.rescheduleDate);
  }

  closeReschedule(): void {
    this.rescheduleApptId = null;
    this.rescheduleDate = '';
    this.selectedSlotId = '';
    this.slotsForDate = [];
    this.availableDates = [];
    this.allProviderSlots = [];
  }

  confirmReschedule(apptId: number): void {
    if (!this.selectedSlotId) return;
    this.isRescheduling = true;
    this.apptService.reschedule(apptId, { newSlotId: +this.selectedSlotId }).subscribe({
      next: () => {
        this.toast.success('Appointment rescheduled successfully!');
        this.closeReschedule();
        this.load();
        this.isRescheduling = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to reschedule appointment.');
        this.isRescheduling = false;
      }
    });
  }

  complete(id: number): void {
    this.apptService.complete(id).subscribe({
      next: () => { this.toast.success('Appointment completed'); this.load(); },
      error: e => this.toast.error(e.error?.message || 'Failed')
    });
  }

  cancel(id: number): void {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    this.apptService.cancel(id).subscribe({
      next: () => { this.toast.success('Appointment cancelled'); this.load(); },
      error: e => this.toast.error(e.error?.message || 'Failed')
    });
  }
}
