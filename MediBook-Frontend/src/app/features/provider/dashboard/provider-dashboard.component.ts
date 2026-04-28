import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ProviderService } from '../../../core/services/provider.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment } from '../../../core/models/appointment.model';
import { Provider, ProviderRegistration } from '../../../core/models/provider.model';
import { SignalRService } from '../../../core/services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-provider-dashboard',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h2>Provider Dashboard 🩺</h2>
        @if (profile) { <p>{{ profile.clinicName }} · {{ profile.specialization }}</p> }
      </div>
    </div>

    @if (loading) {
      <div class="flex justify-center p-8"><p>Loading dashboard...</p></div>
    } @else if (!profile) {
      <!-- ONBOARDING FLOW -->
      <div class="card animate-in glass-panel" style="max-width: 600px; margin: 0 auto;">
        <h3 class="mb-4">Complete Your Provider Profile</h3>
        <p class="text-muted mb-6">You must set up your clinic and specialization before you can manage your schedule.</p>
        
        <form (ngSubmit)="submitSetup()" class="flex flex-col gap-4">
          <div class="grid-2 gap-4">
            <div class="form-group">
              <label class="form-label">Specialization</label>
              <input class="form-control" type="text" [(ngModel)]="setupData.specialization" name="specialization" placeholder="e.g. Cardiologist" required />
            </div>
            <div class="form-group">
              <label class="form-label">Qualification</label>
              <input class="form-control" type="text" [(ngModel)]="setupData.qualification" name="qualification" placeholder="e.g. MD, MBBS" required />
            </div>
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input class="form-control" type="number" [(ngModel)]="setupData.experienceYears" name="experienceYears" placeholder="e.g. 5" required />
            </div>
            <div class="form-group">
              <label class="form-label">Clinic Name</label>
              <input class="form-control" type="text" [(ngModel)]="setupData.clinicName" name="clinicName" placeholder="e.g. City Heart Center" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Clinic Address</label>
            <input class="form-control" type="text" [(ngModel)]="setupData.clinicAddress" name="clinicAddress" placeholder="123 Health Ave, NY" required />
          </div>
          <div class="form-group">
            <label class="form-label">Short Bio</label>
            <textarea class="form-control" [(ngModel)]="setupData.bio" name="bio" rows="3" placeholder="Tell patients about yourself..."></textarea>
          </div>
          <button class="btn btn-primary mt-2" type="submit" [disabled]="isSubmitting">
            {{ isSubmitting ? 'Saving...' : 'Complete Setup' }}
          </button>
        </form>
      </div>
    } @else {
      <!-- NORMAL DASHBOARD -->
      <div class="grid-4 mb-6">
        <div class="stat-card animate-in stagger-1"><div class="stat-value">{{ upcomingAppts.length }}</div><div class="stat-label">Upcoming</div></div>
        <div class="stat-card animate-in stagger-2"><div class="stat-value">{{ totalCount }}</div><div class="stat-label">Total Appointments</div></div>
        <div class="stat-card animate-in stagger-3"><div class="stat-value">{{ profile.avgRating > 0 ? profile.avgRating.toFixed(1) : 'New' }}</div><div class="stat-label">Avg Rating</div></div>
        <div class="stat-card animate-in stagger-4">
          <div class="stat-value">{{ profile.isVerified ? '✓' : '✗' }}</div><div class="stat-label">Verified</div>
        </div>
      </div>

      <div class="flex gap-4 mb-6">
        <a routerLink="/provider/schedule" class="btn btn-primary">🗓️ Manage Schedule</a>
        <a routerLink="/provider/appointments" class="btn btn-secondary">📅 View Appointments</a>
      </div>

      <h3 class="mb-4">Upcoming Appointments</h3>
      @if (upcomingAppts.length === 0) {
        <div class="empty-state glass-panel"><div class="icon">📅</div><p>No upcoming appointments</p></div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (a of upcomingAppts; track a.appointmentId) {
            <div class="card animate-in">
              <div class="flex items-center justify-between">
                <div>
                  <h4>{{ a.serviceType }}</h4>
                  <p class="text-muted" style="font-size:0.85rem;">{{ a.appointmentDate }} · {{ a.startTime }} - {{ a.endTime }} · Patient #{{ a.patientId }}</p>
                </div>
                <span class="badge" [class.badge-info]="a.status==='Scheduled'" [class.badge-success]="a.status==='Completed'"
                      [class.badge-warning]="a.status==='Confirmed'">{{ a.status }}</span>
              </div>
            </div>
          }
        </div>
      }
    }
  `
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);
  private signalRService = inject(SignalRService);
  private cd = inject(ChangeDetectorRef);

  profile: Provider | null = null;
  loading = true;
  isSubmitting = false;
  refreshing = false;
  private signalRSub?: Subscription;

  upcomingAppts: Appointment[] = [];
  totalCount = 0;

  setupData: ProviderRegistration = {
    userId: 0,
    specialization: '',
    qualification: '',
    experienceYears: 0,
    bio: '',
    clinicName: '',
    clinicAddress: ''
  };

  ngOnInit(): void {
    this.setupData.userId = this.auth.getUserId();
    this.checkProfile();

    this.signalRSub = this.signalRService.dashboardUpdate$.subscribe((eventType) => {
      console.log(`ProviderDashboard received SignalR event: ${eventType}`);
      this.checkProfile(true);
    });
  }

  ngOnDestroy(): void {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
  }

  checkProfile(isRefresh = false): void {
    if (isRefresh) this.refreshing = true;
    this.providerService.getAll().subscribe({
      next: providers => {
        this.profile = providers.find(p => p.userId === this.auth.getUserId()) ?? null;
        if (this.profile) {
          this.loadAppointments(this.profile.providerId, isRefresh);
        } else {
          this.loading = false;
          if (isRefresh) this.refreshing = false;
          this.cd.detectChanges();
        }
      },
      error: () => {
        this.loading = false;
        if (isRefresh) this.refreshing = false;
        this.cd.detectChanges();
      }
    });
  }

  submitSetup(): void {
    if (!this.setupData.specialization || !this.setupData.clinicName) {
      this.toast.error('Specialization and Clinic Name are required');
      return;
    }
    
    this.isSubmitting = true;
    this.providerService.register(this.setupData).subscribe({
      next: (newProfile) => {
        this.toast.success('Profile setup complete!');
        this.profile = newProfile;
        this.isSubmitting = false;
        this.loadAppointments(newProfile.providerId, false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to setup profile');
        this.isSubmitting = false;
      }
    });
  }

  private loadAppointments(providerId: number, isRefresh: boolean): void {
    let pending = 2;
    const done = () => {
      if (--pending === 0) {
        this.loading = false;
        if (isRefresh) this.refreshing = false;
        this.cd.detectChanges();
      }
    };

    this.apptService.getByProvider(providerId).subscribe({
      next: all => { 
        this.totalCount = all.length;
        done();
      },
      error: () => done()
    });

    this.apptService.getUpcomingByProvider(providerId).subscribe({
      next: data => {
        this.upcomingAppts = data;
        done();
      },
      error: () => done()
    });
  }
}
