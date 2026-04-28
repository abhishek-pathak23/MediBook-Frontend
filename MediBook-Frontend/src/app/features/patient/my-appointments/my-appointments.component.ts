import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment } from '../../../core/models/appointment.model';
import { AvailabilitySlot } from '../../../core/models/schedule.model';
import { SignalRService } from '../../../core/services/signalr.service';
import { Subscription } from 'rxjs';

import { PaymentService } from '../../../core/services/payment.service';
import { environment } from '../../../../environments/environment';

declare var Razorpay: any;

@Component({
  selector: 'app-my-appointments',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>My Appointments</h2>
      <p>View and manage your appointments</p>
    </div>

    <div class="flex gap-3 mb-6">
      @for (f of filters; track f) {
        <button class="btn btn-sm" [class.btn-primary]="activeFilter === f" [class.btn-ghost]="activeFilter !== f"
                (click)="setFilter(f)">{{ f }}</button>
      }
    </div>

    @if (filtered.length === 0) {
      <div class="empty-state glass-panel">
        <div class="icon">📅</div>
        <p>No {{ activeFilter.toLowerCase() }} appointments</p>
      </div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (appt of filtered; track appt.appointmentId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ appt.serviceType }}</h4>
                <p class="text-muted" style="font-size: 0.85rem;">
                  {{ appt.appointmentDate }} · {{ appt.startTime }} - {{ appt.endTime }}
                </p>
                <div class="flex gap-3 mt-2">
                  <span class="badge badge-accent">{{ appt.modeOfConsultation }}</span>
                  <span class="badge" [class.badge-success]="appt.status === 'Completed'"
                        [class.badge-warning]="appt.status === 'Pending' || appt.status === 'Confirmed'"
                        [class.badge-danger]="appt.status === 'Cancelled'"
                        [class.badge-info]="appt.status === 'Booked' || appt.status === 'Scheduled'">
                    {{ appt.status }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2 flex-wrap" style="justify-content:flex-end;">
                @if (appt.status === 'Scheduled' || appt.status === 'Booked' || appt.status === 'Confirmed' || appt.status === 'Pending') {
                  <button class="btn btn-primary btn-sm" (click)="payNow(appt)"
                          id="pay-{{appt.appointmentId}}">Pay Now</button>
                  <button class="btn btn-outline btn-sm" (click)="openReschedule(appt)"
                          id="reschedule-{{appt.appointmentId}}">
                    {{ rescheduleApptId === appt.appointmentId ? '✕ Close' : '🗓 Reschedule' }}
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="cancelAppointment(appt.appointmentId)"
                          id="cancel-{{appt.appointmentId}}">Cancel</button>
                }
                @if (appt.status === 'Confirmed' || appt.status === 'Completed') {
                  <button class="btn btn-outline btn-sm" (click)="downloadInvoice(appt.appointmentId)"
                          id="invoice-{{appt.appointmentId}}">📄 Invoice</button>
                }
              </div>
            </div>

            <!-- ── Inline Reschedule Panel ── -->
            @if (rescheduleApptId === appt.appointmentId) {
              <div class="animate-in" style="margin-top:16px; padding-top:16px; border-top: 1px solid #334155;">
                <h4 style="margin-bottom:12px;">🗓 Pick a New Date & Slot</h4>

                @if (loadingSlots) {
                  <p class="text-muted" style="font-size:0.85rem;">⏳ Loading available dates...</p>
                } @else if (availableDates.length === 0) {
                  <div style="padding:12px; background:rgba(239,68,68,0.1); border-radius:8px; color:#ef4444; font-size:0.85rem;">
                    ⚠️ No available slots found for this provider. Please try again later.
                  </div>
                } @else {
                  <div class="grid-2 gap-4">
                    <div class="form-group">
                      <label class="form-label">Select a Date</label>
                      <select class="form-control" [(ngModel)]="rescheduleDate"
                              (ngModelChange)="onDateChange()"
                              id="reschedule-date-{{appt.appointmentId}}">
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
                                id="reschedule-slot-{{appt.appointmentId}}">
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
                            (click)="confirmReschedule(appt.appointmentId)"
                            id="confirm-reschedule-{{appt.appointmentId}}">
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
export class MyAppointmentsComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private scheduleService = inject(ScheduleService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);
  private signalRService = inject(SignalRService);

  appointments: Appointment[] = [];
  filtered: Appointment[] = [];
  filters = ['All', 'Upcoming', 'Completed', 'Cancelled'];
  activeFilter = 'All';
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
    this.load();
    this.signalRSub = this.signalRService.dashboardUpdate$.subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    if (this.signalRSub) this.signalRSub.unsubscribe();
  }

  load(): void {
    this.apptService.getByPatient(this.auth.getUserId()).subscribe({
      next: (data) => {
        this.appointments = data;
        this.applyFilter();
        this.cd.detectChanges();
      }
    });
  }

  setFilter(f: string): void {
    this.activeFilter = f;
    this.applyFilter();
    this.cd.detectChanges();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'All') {
      this.filtered = this.appointments;
    } else if (this.activeFilter === 'Upcoming') {
      this.filtered = this.appointments.filter(a =>
        a.status === 'Scheduled' || a.status === 'Booked' || a.status === 'Confirmed' || a.status === 'Pending'
      );
    } else {
      this.filtered = this.appointments.filter(a => a.status === this.activeFilter);
    }
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

    // Fetch ALL provider slots once, then derive available dates
    this.scheduleService.getByProvider(appt.providerId).subscribe({
      next: (slots) => {
        const today = this.today;
        this.allProviderSlots = slots.filter(s => !s.isBooked && !s.isBlocked && s.date >= today);
        // Extract unique sorted dates
        const dateSet = new Set(this.allProviderSlots.map(s => s.date));
        this.availableDates = Array.from(dateSet).sort();
        this.loadingSlots = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loadingSlots = false;
        this.toast.error('Failed to load available dates.');
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

  cancelAppointment(id: number): void {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    this.apptService.cancel(id).subscribe({
      next: () => { this.toast.success('Appointment cancelled'); this.load(); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to cancel'); }
    });
  }

  payNow(appt: Appointment): void {
    this.paymentService.createRazorpayOrder(appt.appointmentId).subscribe({
      next: (order) => {
        const options = {
          key: environment.razorpayKey || 'rzp_test_1234567890',
          currency: 'INR',
          name: 'MediBook',
          description: 'Appointment Consultation Fee',
          order_id: order.razorpayOrderId,
          handler: (response: any) => {
            this.paymentService.verifyRazorpayPayment({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              appointmentId: appt.appointmentId
            }).subscribe({
              next: () => { this.toast.success('Payment successful!'); this.load(); },
              error: () => { this.toast.error('Payment verification failed'); }
            });
          },
          prefill: {
            name: this.auth.currentUser()?.fullName,
            email: this.auth.currentUser()?.email
          },
          theme: { color: '#00dc82' }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to initialize payment'); }
    });
  }

  downloadInvoice(apptId: number): void {
    this.paymentService.downloadInvoice(apptId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Invoice_${apptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => { this.toast.error('Could not download invoice. Make sure payment is completed.'); }
    });
  }
}
