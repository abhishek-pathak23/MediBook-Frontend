import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { ProviderService } from '../../../core/services/provider.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page-header">
      <div>
        <h2>Admin Dashboard 🛡️</h2>
        <p>Platform overview and management</p>
    </div>
    @if (errorMessage) {
      <div class="alert alert-danger" style="color: red; padding: 10px; border: 1px solid red; margin-bottom: 20px;">
        {{ errorMessage }}
      </div>
    }

    <div class="grid-4 mb-6">
      <div class="stat-card animate-in stagger-1"><div class="stat-value">{{ userCount }}</div><div class="stat-label">Total Users</div></div>
      <div class="stat-card animate-in stagger-2"><div class="stat-value">{{ providerCount }}</div><div class="stat-label">Providers</div></div>
      <div class="stat-card animate-in stagger-3"><div class="stat-value">{{ appointmentCount }}</div><div class="stat-label">Appointments</div></div>
      <div class="stat-card animate-in stagger-4"><div class="stat-value">₹{{ totalRevenue | number:'1.0-0' }}</div><div class="stat-label">Revenue</div></div>
    </div>

    <div class="flex gap-4 mb-6">
      <a routerLink="/admin/users" class="btn btn-primary">👥 Manage Users</a>
    </div>

    <h3 class="mb-4">Unverified Providers</h3>
    @if (unverified.length === 0) {
      <div class="empty-state glass-panel"><div class="icon">✓</div><p>All providers verified</p></div>
    } @else {
      <div class="flex flex-col gap-3">
        @for (p of unverified; track p.providerId) {
          <div class="card animate-in">
            <div class="flex items-center justify-between">
              <div>
                <h4>{{ p.clinicName }}</h4>
                <p class="text-muted" style="font-size:0.85rem;">{{ p.specialization }} · {{ p.qualification }}</p>
              </div>
              <button class="btn btn-primary btn-sm" (click)="verifyProvider(p.providerId)">Verify</button>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private providerService = inject(ProviderService);
  private paymentService = inject(PaymentService);
  private signalRService = inject(SignalRService);
  private cd = inject(ChangeDetectorRef);

  userCount = 0; providerCount = 0; appointmentCount = 0; totalRevenue = 0;
  unverified: any[] = [];
  errorMessage = '';
  refreshing = false;
  private signalRSub?: Subscription;

  ngOnInit(): void {
    this.loadStats();
    
    // Listen for real-time dashboard updates via SignalR
    this.signalRSub = this.signalRService.dashboardUpdate$.subscribe((eventType) => {
      console.log(`AdminDashboard received SignalR event: ${eventType}`);
      this.loadStats();
    });
  }

  ngOnDestroy(): void {
    if (this.signalRSub) {
      this.signalRSub.unsubscribe();
    }
  }

  loadStats(): void {
    this.refreshing = true;
    this.errorMessage = '';
    let pending = 4;
    const done = () => { if (--pending === 0) { this.refreshing = false; this.cd.detectChanges(); } };

    this.auth.getAllUsers().subscribe({
      next: u => { this.userCount = u.length; done(); },
      error: (err: any) => { this.errorMessage += 'Auth Error: ' + err.message + ' | '; done(); }
    });

    this.providerService.getAll().subscribe({
      next: ps => {
        this.providerCount = ps.length;
        this.unverified = ps.filter(p => !p.isVerified);
        done();
      },
      error: (err: any) => { this.errorMessage += 'Provider Error: ' + err.message + ' | '; done(); }
    });

    this.apptService.getAll().subscribe({
      next: a => { this.appointmentCount = a.length; done(); },
      error: (err: any) => { this.errorMessage += 'Appt Error: ' + err.message + ' | '; done(); }
    });

    this.paymentService.getAllRevenue().subscribe({
      next: r => { this.totalRevenue = r.totalRevenue; done(); },
      error: (err: any) => { this.errorMessage += 'Payment Error: ' + err.message + ' | '; done(); }
    });
  }

  verifyProvider(id: number): void {
    this.providerService.verify(id).subscribe({
      next: () => {
        this.unverified = this.unverified.filter(p => p.providerId !== id);
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage += 'Verify Error: ' + err.message + ' | ';
        this.cd.detectChanges();
      }
    });
  }
}
