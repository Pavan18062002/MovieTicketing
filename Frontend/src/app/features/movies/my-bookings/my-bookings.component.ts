import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { BookingResponse } from '../../../core/models/models';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './my-bookings.component.html',
  styleUrl: './my-bookings.component.css'
})
export class MyBookingsComponent implements OnInit {
  private api = inject(ApiService);

  // Component state signals for user's booking history
  bookings = signal<BookingResponse[]>([]);
  loading  = signal(true);
  error    = signal('');
  activeTab = signal<'upcoming' | 'past'>('upcoming');

  // Filters bookings based on active tab selection (Upcoming vs Past shows)
  filteredBookings = computed(() => {
    const all = this.bookings();
    const now = new Date();
    if (this.activeTab() === 'upcoming') {
      return all.filter(b => new Date(b.showTime) >= now);
    } else {
      return all.filter(b => new Date(b.showTime) < now);
    }
  });

  ngOnInit(): void {
    // Fetch booking history for currently logged-in user
    this.api.getMyBookings().subscribe({
      next: res => {
        if (res.success) {
          this.bookings.set(res.data ?? []);
        } else {
          this.error.set(res.message);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load your bookings. Please make sure you are signed in.');
        this.loading.set(false);
      }
    });
  }

  // Formats booked seat numbers into comma-separated string (e.g. "A1, A2")
  getSeatsString(booking: BookingResponse): string {
    return booking.seats.map(s => s.seatNumber).join(', ');
  }

  // Toggles between Upcoming and Past tabs
  setTab(tab: 'upcoming' | 'past'): void {
    this.activeTab.set(tab);
  }

  // Fallback handler if poster image fails to load
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/100x140/131326/8b5cf6?text=Ticket';
  }
}
