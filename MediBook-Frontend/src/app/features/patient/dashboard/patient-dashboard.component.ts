import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Appointment } from '../../../core/models/appointment.model';
import { SignalRService } from '../../../core/services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-dashboard',
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h2>Welcome back, {{ auth.currentUser()?.fullName }} 👋</h2>
        <p>Here's an overview of your health journey</p>
      </div>
    </div>

    <div class="grid-4 mb-6">
      <div class="stat-card animate-in stagger-1">
        <div class="stat-value">{{ upcomingCount }}</div>
        <div class="stat-label">Upcoming</div>
      </div>
      <div class="stat-card animate-in stagger-2">
        <div class="stat-value">{{ totalAppointments }}</div>
        <div class="stat-label">Total Appointments</div>
      </div>
      <div class="stat-card animate-in stagger-3">
        <div class="stat-value">{{ completedCount }}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card animate-in stagger-4">
        <div class="stat-value">{{ notif.unreadCount() }}</div>
        <div class="stat-label">Notifications</div>
      </div>
    </div>

    <div class="flex gap-4 mb-6">
      <a routerLink="/patient/providers" class="btn btn-primary" id="find-provider-btn">🔍 Find a Provider</a>
      <a routerLink="/patient/appointments" class="btn btn-secondary">📅 My Appointments</a>
    </div>

    <h3 class="mb-4">Upcoming Appointments</h3>
    @if (upcoming.length === 0) {
      <div class="empty-state glass-panel">
        <div class="icon">📅</div>
        <p>No upcoming appointments</p>
        <a routerLink="/patient/providers" class="btn btn-primary mt-4">Book Now</a>
      </div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (appt of upcoming; track appt.appointmentId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ appt.serviceType }}</h4>
                <p class="text-muted" style="font-size: 0.85rem;">
                  {{ appt.appointmentDate }} · {{ appt.startTime }} - {{ appt.endTime }}
                </p>
                <span class="badge badge-accent mt-2">{{ appt.modeOfConsultation }}</span>
              </div>
              <span class="badge badge-info">{{ appt.status }}</span>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notif = inject(NotificationService);
  private apptService = inject(AppointmentService);
  private cd = inject(ChangeDetectorRef);
  private signalRService = inject(SignalRService);

  upcoming: Appointment[] = [];
  totalAppointments = 0;
  upcomingCount = 0;
  completedCount = 0;
  refreshing = false;
  private signalRSub?: Subscription;

  ngOnInit(): void {
    this.loadData();
    
    this.signalRSub = this.signalRService.dashboardUpdate$.subscribe((eventType) => {
      console.log(`PatientDashboard received SignalR event: ${eventType}`);
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
  }

  loadData(): void {
    this.refreshing = true;
    const userId = this.auth.getUserId();
    this.notif.refreshUnreadCount();

    let pending = 2;
    const done = () => { if (--pending === 0) { this.refreshing = false; this.cd.detectChanges(); } };

    this.apptService.getByPatient(userId).subscribe({
      next: (all) => {
        this.totalAppointments = all.length;
        this.completedCount = all.filter(a => a.status === 'Completed').length;
        done();
      },
      error: () => done()
    });

    this.apptService.getUpcoming(userId).subscribe({
      next: (data) => {
        this.upcoming = data.slice(0, 5);
        this.upcomingCount = data.length;
        done();
      },
      error: () => done()
    });
  }
}
