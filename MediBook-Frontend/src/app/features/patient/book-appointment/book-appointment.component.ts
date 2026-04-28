import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProviderService } from '../../../core/services/provider.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ToastService } from '../../../core/services/toast.service';
import { Provider } from '../../../core/models/provider.model';
import { AvailabilitySlot } from '../../../core/models/schedule.model';

@Component({
  selector: 'app-book-appointment',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>Book Appointment</h2>
      @if (provider) {
        <p>{{ provider.clinicName }} · {{ provider.specialization }}</p>
      }
    </div>

    @if (provider) {
      <div class="card mb-6 animate-in">
        <h4>{{ provider.clinicName }}</h4>
        <p class="text-secondary">{{ provider.specialization }} · {{ provider.qualification }}</p>
        <p class="text-muted" style="font-size: 0.85rem;">📍 {{ provider.clinicAddress }}</p>
        <p class="text-muted" style="font-size: 0.85rem;">{{ provider.bio }}</p>
      </div>
    }

    <div class="card mb-6 animate-in stagger-1">
      <h4 class="mb-4">Select Date</h4>
      @if (availableDates.length > 0) {
        <select class="form-control" [(ngModel)]="selectedDate" (change)="loadSlots()" id="appointment-date">
          @for (d of availableDates; track d) {
            <option [value]="d">{{ d }}</option>
          }
        </select>
      } @else {
        <p class="text-muted">Loading available dates or no dates available...</p>
      }
    </div>

    @if (selectedDate) {
      <div class="card mb-6 animate-in stagger-2">
        <h4 class="mb-4">Available Slots</h4>
        @if (slots.length === 0) {
          <p class="text-muted">No available slots for this date.</p>
        } @else {
          <div class="flex flex-wrap gap-3">
            @for (slot of slots; track slot.slotId) {
              <button class="btn" id="slot-{{slot.slotId}}"
                      [class.btn-primary]="selectedSlot?.slotId === slot.slotId"
                      [class.btn-secondary]="selectedSlot?.slotId !== slot.slotId"
                      (click)="selectSlot(slot)">
                {{ slot.startTime }} - {{ slot.endTime }}
              </button>
            }
          </div>
        }
      </div>
    }

    @if (selectedSlot) {
      <div class="card mb-6 animate-in stagger-3">
        <h4 class="mb-4">Appointment Details</h4>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Service Type & Fee</label>
            <select class="form-control" [(ngModel)]="serviceType" id="service-type">
              <option value="General Consultation">General Consultation (₹500)</option>
              <option value="Specialist Consultation">Specialist Consultation (₹1500)</option>
              <option value="Emergency Visit">Emergency Visit (₹2500)</option>
              <option value="Follow-up">Follow-up (₹800)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Consultation Mode</label>
            <select class="form-control" [(ngModel)]="mode" id="consultation-mode">
              <option value="In-Person">In-Person</option>
              <option value="Teleconsultation">Teleconsultation</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-control" [(ngModel)]="notes" rows="3"
                      placeholder="Any symptoms or concerns..." id="appointment-notes"></textarea>
          </div>
          <button class="btn btn-primary btn-lg" [disabled]="booking" (click)="bookAppointment()" id="confirm-booking">
            {{ booking ? 'Booking...' : '✓ Confirm Booking' }}
          </button>
        </div>
      </div>
    }
  `
})
export class BookAppointmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private providerService = inject(ProviderService);
  private scheduleService = inject(ScheduleService);
  private apptService = inject(AppointmentService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  provider: Provider | null = null;
  slots: AvailabilitySlot[] = [];
  availableDates: string[] = [];
  selectedDate = '';
  selectedSlot: AvailabilitySlot | null = null;
  serviceType = '';
  mode = 'In-Person';
  notes = '';
  booking = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('providerId'));
    this.providerService.getById(id).subscribe({
      next: (p) => {
        this.provider = p;
        this.cd.detectChanges();
        this.fetchAllAvailableDates(id);
      }
    });
  }

  private fetchAllAvailableDates(providerId: number): void {
    this.scheduleService.getByProvider(providerId).subscribe({
      next: (allSlots) => {
        const available = allSlots.filter(s => !s.isBooked && !s.isBlocked);
        const uniqueDates = [...new Set(available.map(s => s.date))].sort();
        this.availableDates = uniqueDates;

        if (this.availableDates.length > 0) {
          this.selectedDate = this.availableDates[0];
          this.loadSlots();
        }
        this.cd.detectChanges();
      }
    });
  }

  loadSlots(): void {
    if (!this.provider || !this.selectedDate) return;
    this.selectedSlot = null;
    this.scheduleService.getAvailable(this.provider.providerId, this.selectedDate).subscribe({
      next: (s) => {
        this.slots = s;
        this.cd.detectChanges();
      },
      error: () => {
        this.slots = [];
        this.cd.detectChanges();
      }
    });
  }

  selectSlot(slot: AvailabilitySlot): void {
    this.selectedSlot = slot;
    this.cd.detectChanges();
  }

  bookAppointment(): void {
    if (!this.provider || !this.selectedSlot || !this.serviceType) {
      this.toast.error('Please fill in all required fields.');
      return;
    }
    this.booking = true;
    this.cd.detectChanges();

    this.apptService.book({
      providerId: this.provider.providerId,
      slotId: this.selectedSlot.slotId,
      serviceType: this.serviceType,
      appointmentDate: this.selectedDate,
      startTime: this.selectedSlot.startTime,
      endTime: this.selectedSlot.endTime,
      notes: this.notes || undefined,
      modeOfConsultation: this.mode
    }).subscribe({
      next: () => {
        this.toast.success('Appointment booked successfully!');
        this.router.navigate(['/patient/appointments']);
      },
      error: (err) => {
        this.booking = false;
        this.cd.detectChanges();
        this.toast.error(err.error?.message || 'Booking failed.');
      }
    });
  }
}
