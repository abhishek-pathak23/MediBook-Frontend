import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ProviderService } from '../../../core/services/provider.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvailabilitySlot } from '../../../core/models/schedule.model';

@Component({
  selector: 'app-manage-schedule',
  imports: [FormsModule],
  template: `
    <div class="page-header">
      <h2>Manage Schedule</h2>
      <p>Create and manage your availability slots</p>
    </div>

    <div class="card mb-6 animate-in">
      <h4 class="mb-4">Add Single Slot</h4>
      <div class="grid-2 gap-4">
        <div class="form-group"><label class="form-label">Date</label>
          <input class="form-control" type="date" [(ngModel)]="slotDate" /></div>
        <div class="form-group"><label class="form-label">Duration (min)</label>
          <input class="form-control" type="number" [(ngModel)]="slotDuration" /></div>
        <div class="form-group"><label class="form-label">Start Time</label>
          <input class="form-control" type="time" [(ngModel)]="slotStart" (change)="onStartChange()" /></div>
        <div class="form-group"><label class="form-label">End Time <small class="text-muted">(auto-calculated)</small></label>
          <input class="form-control" type="time" [(ngModel)]="slotEnd" /></div>
      </div>
      <button class="btn btn-primary mt-4" (click)="addSlot()" [disabled]="!providerId">Add Slot</button>
    </div>

    <div class="card mb-6 animate-in stagger-1">
      <h4 class="mb-4">Generate Recurring Schedule</h4>
      <div class="grid-2 gap-4">
        <div class="form-group"><label class="form-label">Recurrence</label>
          <select class="form-control" [(ngModel)]="recurrence">
            <option value="Daily">Daily</option><option value="Weekly">Weekly</option>
          </select></div>
        <div class="form-group"><label class="form-label">Duration (min)</label>
          <input class="form-control" type="number" [(ngModel)]="recDuration" /></div>
        <div class="form-group"><label class="form-label">Start Date</label>
          <input class="form-control" type="date" [(ngModel)]="recStartDate" /></div>
        <div class="form-group"><label class="form-label">End Date</label>
          <input class="form-control" type="date" [(ngModel)]="recEndDate" /></div>
        <div class="form-group"><label class="form-label">Start Time</label>
          <input class="form-control" type="time" [(ngModel)]="recStart" (change)="onRecStartChange()" /></div>
        <div class="form-group"><label class="form-label">End Time <small class="text-muted">(auto-calculated)</small></label>
          <input class="form-control" type="time" [(ngModel)]="recEnd" /></div>
      </div>
      <button class="btn btn-primary mt-4" (click)="generateRecurring()" [disabled]="!providerId">Generate</button>
    </div>

    <h3 class="mb-4">Current Slots</h3>
    @if (slots.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">🗓️</div><p>No slots created yet</p></div>
    } @else {
      <table class="data-table">
        <thead><tr><th>Date</th><th>Time</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          @for (s of slots; track s.slotId) {
            <tr>
              <td>{{ s.date }}</td>
              <td>{{ formatTime12Hour(s.startTime) }} - {{ formatTime12Hour(s.endTime) }}</td>
              <td>{{ s.durationMinutes }}m</td>
              <td><span class="badge" [class.badge-success]="s.status==='Available'"
                   [class.badge-warning]="s.status==='Blocked'" [class.badge-danger]="s.status==='Booked'">{{ s.status }}</span></td>
              <td class="flex gap-3">
                @if (s.status === 'Available') {
                  <button class="btn btn-ghost btn-sm" (click)="blockSlot(s.slotId)">Block</button>
                } @else if (s.status === 'Blocked') {
                  <button class="btn btn-ghost btn-sm" (click)="unblockSlot(s.slotId)">Unblock</button>
                }
                @if (s.status !== 'Booked') {
                  <button class="btn btn-danger btn-sm" (click)="deleteSlot(s.slotId)">Delete</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class ManageScheduleComponent implements OnInit {
  private auth = inject(AuthService);
  private schedService = inject(ScheduleService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);
  private cd = inject(ChangeDetectorRef);

  providerId = 0;
  slots: AvailabilitySlot[] = [];

  slotDate = ''; slotStart = ''; slotEnd = ''; slotDuration = 30;
  recurrence = 'Weekly'; recStartDate = ''; recEndDate = ''; recStart = ''; recEnd = ''; recDuration = 30;

  ngOnInit(): void {
    this.providerService.getAll().subscribe({
      next: providers => {
        const p = providers.find(p => p.userId === this.auth.getUserId());
        if (p) {
          this.providerId = p.providerId;
          this.loadSlots();
        }
      }
    });
  }

  loadSlots(): void {
    this.schedService.getByProvider(this.providerId).subscribe({
      next: d => {
        this.slots = d.map(s => ({
          ...s,
          status: s.isBooked ? 'Booked' : (s.isBlocked ? 'Blocked' : 'Available')
        }));
        this.cd.detectChanges();
      },
      error: err => {
        this.toast.error('Failed to load slots');
        this.cd.detectChanges();
      }
    });
  }

  addSlot(): void {
    if (!this.slotDate || !this.slotStart || !this.slotEnd) {
      this.toast.error('Please fill in Date, Start Time and End Time.');
      return;
    }
    if (this.slotEnd <= this.slotStart) {
      this.toast.error('End Time must be after Start Time.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (this.slotDate < today) {
      this.toast.error('Cannot create a slot in the past.');
      return;
    }
    const formattedStart = this.slotStart.length === 5 ? `${this.slotStart}:00` : this.slotStart;
    const formattedEnd = this.slotEnd.length === 5 ? `${this.slotEnd}:00` : this.slotEnd;

    this.schedService.addSlot({
      providerId: this.providerId, date: this.slotDate,
      startTime: formattedStart, endTime: formattedEnd, durationMinutes: this.slotDuration
    }).subscribe({
      next: () => { this.toast.success('Slot added'); this.loadSlots(); },
      error: (e: any) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  generateRecurring(): void {
    if (!this.recStartDate || !this.recEndDate || !this.recStart || !this.recEnd) {
      this.toast.error('Please fill in all recurring schedule fields.');
      return;
    }
    if (this.recEnd <= this.recStart) {
      this.toast.error('End Time must be after Start Time.');
      return;
    }
    if (this.recEndDate < this.recStartDate) {
      this.toast.error('End Date must be after Start Date.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (this.recStartDate < today) {
      this.toast.error('Start Date cannot be in the past.');
      return;
    }
    const formattedStart = this.recStart.length === 5 ? `${this.recStart}:00` : this.recStart;
    const formattedEnd = this.recEnd.length === 5 ? `${this.recEnd}:00` : this.recEnd;

    this.schedService.generateRecurring({
      providerId: this.providerId, recurrence: this.recurrence,
      startDate: this.recStartDate, endDate: this.recEndDate,
      startTime: formattedStart, endTime: formattedEnd, durationMinutes: this.recDuration
    }).subscribe({
      next: () => { this.toast.success('Recurring slots generated'); this.loadSlots(); },
      error: (e: any) => this.toast.error(e.error?.message || 'Failed')
    });
  }

  // Auto-calculate end time = start time + duration
  onStartChange(): void {
    if (!this.slotStart || !this.slotDuration) return;
    this.slotEnd = this.addMinutes(this.slotStart, this.slotDuration);
  }

  onRecStartChange(): void {
    if (!this.recStart || !this.recDuration) return;
    this.recEnd = this.addMinutes(this.recStart, this.recDuration);
  }

  private addMinutes(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  formatTime12Hour(timeStr: string): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  blockSlot(id: number): void { this.schedService.blockSlot(id).subscribe({ next: () => this.loadSlots() }); }
  unblockSlot(id: number): void { this.schedService.unblockSlot(id).subscribe({ next: () => this.loadSlots() }); }
  deleteSlot(id: number): void { this.schedService.deleteSlot(id).subscribe({ next: () => { this.toast.success('Slot deleted'); this.loadSlots(); } }); }
}
