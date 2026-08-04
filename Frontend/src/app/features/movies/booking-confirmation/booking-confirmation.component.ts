import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { BookingResponse } from '../../../core/models/models';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './booking-confirmation.component.html',
  styleUrl: './booking-confirmation.component.css'
})
export class BookingConfirmationComponent implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  booking = signal<BookingResponse | null>(null);
  loading = signal(true);
  error   = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getBookingById(id).subscribe({
      next: res => {
        if (res.success) {
          this.booking.set(res.data);
        } else {
          this.error.set(res.message);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load booking details.');
        this.loading.set(false);
      }
    });
  }
}
