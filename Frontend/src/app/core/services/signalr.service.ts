import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface SeatsLockedEvent {
  showId: number;
  seatIds: number[];
  lockedByUserId: string;
}

export interface SeatsUnlockedEvent {
  showId: number;
  seatIds: number[];
}

export interface SeatsBookedEvent {
  showId: number;
  seatIds: number[];
}

export interface LowStockAlertEvent {
  concessionItemId: number;
  itemName: string;
  itemSize: string;
  currentStock: number;
  baseStock: number;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private auth = inject(AuthService);

  private showHub: signalR.HubConnection | null = null;
  private adminHub: signalR.HubConnection | null = null;

  // Real-time streams for seat booking events
  private seatsLockedSubject = new Subject<SeatsLockedEvent>();
  private seatsUnlockedSubject = new Subject<SeatsUnlockedEvent>();
  private seatsBookedSubject = new Subject<SeatsBookedEvent>();

  // Real-time stream for inventory low-stock alerts
  private lowStockAlertSubject = new Subject<LowStockAlertEvent>();

  readonly seatsLocked$: Observable<SeatsLockedEvent> = this.seatsLockedSubject.asObservable();
  readonly seatsUnlocked$: Observable<SeatsUnlockedEvent> = this.seatsUnlockedSubject.asObservable();
  readonly seatsBooked$: Observable<SeatsBookedEvent> = this.seatsBookedSubject.asObservable();
  readonly lowStockAlert$: Observable<LowStockAlertEvent> = this.lowStockAlertSubject.asObservable();

  // Connects to ShowHub and listens for seat state changes
  async startShowConnection(): Promise<void> {
    if (this.showHub && this.showHub.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.showHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/shows`, {
        accessTokenFactory: () => this.auth.getToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    this.showHub.on('SeatsLocked', (data: SeatsLockedEvent) => {
      this.seatsLockedSubject.next(data);
    });

    this.showHub.on('SeatsUnlocked', (data: SeatsUnlockedEvent) => {
      this.seatsUnlockedSubject.next(data);
    });

    this.showHub.on('SeatsBooked', (data: SeatsBookedEvent) => {
      this.seatsBookedSubject.next(data);
    });

    try {
      await this.showHub.start();
    } catch (err) {
      console.warn('SignalR ShowHub connection error:', err);
    }
  }

  // Join group for this specific show to isolate live traffic
  async joinShowGroup(showId: number): Promise<void> {
    await this.startShowConnection();
    if (this.showHub?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.showHub.invoke('JoinShowGroup', showId);
      } catch (err) {
        console.warn(`Could not join SignalR group for show ${showId}:`, err);
      }
    }
  }

  async leaveShowGroup(showId: number): Promise<void> {
    if (this.showHub?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.showHub.invoke('LeaveShowGroup', showId);
      } catch (err) {
        console.warn(`Could not leave SignalR group for show ${showId}:`, err);
      }
    }
  }

  async stopShowConnection(): Promise<void> {
    if (this.showHub) {
      await this.showHub.stop();
      this.showHub = null;
    }
  }

  // Connects to AdminHub for inventory warnings
  async startAdminConnection(): Promise<void> {
    if (this.adminHub && this.adminHub.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.adminHub = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/admin`, {
        accessTokenFactory: () => this.auth.getToken() || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    this.adminHub.on('LowStockAlert', (data: LowStockAlertEvent) => {
      this.lowStockAlertSubject.next(data);
    });

    try {
      await this.adminHub.start();
    } catch (err) {
      console.warn('SignalR AdminHub connection error:', err);
    }
  }

  async stopAdminConnection(): Promise<void> {
    if (this.adminHub) {
      await this.adminHub.stop();
      this.adminHub = null;
    }
  }
}
