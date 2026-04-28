import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';
import { SignalRService } from './signalr.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = environment.apis.notification;
  unreadCount = signal(0);
  private signalRSub?: Subscription;

  constructor(private http: HttpClient, private signalRService: SignalRService) {
    this.signalRSub = this.signalRService.notification$.subscribe(() => {
      this.refreshUnreadCount();
    });
  }

  getMyNotifications() {
    return this.http.get<Notification[]>(`${this.api}?t=${new Date().getTime()}`);
  }

  getUnreadCount() {
    return this.http.get<{ unreadCount: number }>(`${this.api}/unreadCount`);
  }

  markAsRead(id: number) {
    return this.http.put(`${this.api}/${id}/read`, {});
  }

  markAllRead() {
    return this.http.put(`${this.api}/readAll`, {});
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: res => this.unreadCount.set(res.unreadCount),
      error: () => this.unreadCount.set(0)
    });
  }
}
