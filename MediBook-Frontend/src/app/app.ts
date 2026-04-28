import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ToastService } from './core/services/toast.service';
import { Notification } from './core/models/notification.model';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  auth = inject(AuthService);
  notif = inject(NotificationService);
  toast = inject(ToastService);
  router = inject(Router);
  private cd = inject(ChangeDetectorRef);

  showNotifPanel = false;
  notifications: Notification[] = [];

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.notif.refreshUnreadCount();
    }
  }

  get showNav(): boolean {
    const url = this.router.url;
    return url !== '/login' && url !== '/register';
  }

  get dashboardLink(): string {
    const role = this.auth.getRole();
    if (role === 'Patient') return '/patient/dashboard';
    if (role === 'Provider') return '/provider/dashboard';
    if (role === 'Admin') return '/admin/dashboard';
    return '/login';
  }

  get sidebarItems(): { label: string; icon: string; link: string }[] {
    const role = this.auth.getRole();
    if (role === 'Patient') {
      return [
        { label: 'Dashboard', icon: '🏠', link: '/patient/dashboard' },
        { label: 'Find Providers', icon: '🔍', link: '/patient/providers' },
        { label: 'My Appointments', icon: '📅', link: '/patient/appointments' },
        { label: 'Medical Records', icon: '📋', link: '/patient/records' },
        { label: 'My Reviews', icon: '⭐', link: '/patient/reviews' },
        { label: 'Change Password', icon: '🔒', link: '/patient/settings' }
      ];
    }
    if (role === 'Provider') {
      return [
        { label: 'Dashboard', icon: '🏠', link: '/provider/dashboard' },
        { label: 'Manage Schedule', icon: '🗓️', link: '/provider/schedule' },
        { label: 'Appointments', icon: '📅', link: '/provider/appointments' },
        { label: 'Patient Records', icon: '📋', link: '/provider/records' },
        { label: 'Change Password', icon: '🔒', link: '/provider/settings' }
      ];
    }
    if (role === 'Admin') {
      return [
        { label: 'Dashboard', icon: '🏠', link: '/admin/dashboard' },
        { label: 'User Management', icon: '👥', link: '/admin/users' },
        { label: 'Change Password', icon: '🔒', link: '/admin/settings' }
      ];
    }
    return [];
  }

  toggleNotifications(): void {
    this.showNotifPanel = !this.showNotifPanel;
    if (this.showNotifPanel) {
      this.notif.getMyNotifications().subscribe({
        next: data => {
          this.notifications = data;
          this.cd.detectChanges();
        },
        error: (err) => {
          this.toast.error('Failed to load notifications: ' + err.message);
          this.notifications = [];
          this.cd.detectChanges();
        }
      });
    }
  }

  markRead(n: Notification): void {
    if (n.isRead) return;
    this.notif.markAsRead(n.notificationId).subscribe({
      next: () => {
        n.isRead = true;
        this.notif.refreshUnreadCount();
        this.cd.detectChanges();
      }
    });
  }

  markAllRead(): void {
    this.notif.markAllRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.notif.refreshUnreadCount();
        this.cd.detectChanges();
      }
    });
  }

  doLogout(): void {
    this.auth.logout().subscribe({
      next: () => this.toast.success('Logged out successfully'),
      error: () => this.auth.clearSession()
    });
  }
}
