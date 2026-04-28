import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  
  // Expose observables for components to subscribe to
  public dashboardUpdate$ = new Subject<string>();
  public notification$ = new Subject<any>();

  constructor() {}

  public connect(token: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return; // Already connected
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.signalrHub}?access_token=${token}`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.registerListeners();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Hub connected directly to notification-service.'))
      .catch(err => console.error('Error while starting SignalR connection: ' + err));
  }

  public disconnect() {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => console.log('SignalR Hub disconnected.'));
      this.hubConnection = null;
    }
  }

  private registerListeners() {
    if (!this.hubConnection) return;

    this.hubConnection.on('DashboardUpdate', (eventType: string) => {
      console.log(`[SignalR] Received dashboard update event: ${eventType}`);
      this.dashboardUpdate$.next(eventType);
    });

    this.hubConnection.on('ReceiveNotification', (notification: any) => {
      console.log(`[SignalR] Received notification:`, notification);
      this.notification$.next(notification);
    });
  }
}
