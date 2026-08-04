import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { SeatInfo, ShowSeatsResponse, ConcessionItem, BookingConcessionItem, BookingResponse } from '../../../core/models/models';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  showData     = signal<ShowSeatsResponse | null>(null);
  concessions  = signal<ConcessionItem[]>([]);
  loading      = signal(true);
  submitting   = signal(false);
  errorMsg     = signal('');
  step         = signal<1 | 2 | 3>(1);

  selectedSeatIds  = signal<Set<number>>(new Set());
  concessionCart   = signal<Map<number, number>>(new Map());
  bookingResult    = signal<BookingResponse | null>(null);

  seatGrid = computed(() => {
    const data = this.showData();
    if (!data) return [];
    const rows: SeatInfo[][] = [];
    for (let r = 1; r <= data.totalRows; r++) {
      rows.push(data.seats.filter(s => s.row === r).sort((a, b) => a.column - b.column));
    }
    return rows;
  });

  selectedSeats = computed(() =>
    (this.showData()?.seats ?? []).filter(s => this.selectedSeatIds().has(s.id))
  );

  ticketsTotal = computed(() =>
    this.selectedSeats().reduce((sum, s) => sum + s.price, 0)
  );

  concessionsTotal = computed(() => {
    let total = 0;
    this.concessionCart().forEach((qty, id) => {
      const item = this.concessions().find(c => c.id === id);
      if (item) total += item.price * qty;
    });
    return total;
  });

  grandTotal = computed(() => this.ticketsTotal() + this.concessionsTotal());

  ngOnInit(): void {
    const showId = Number(this.route.snapshot.paramMap.get('showId'));
    this.api.getShowSeats(showId).subscribe(res => {
      this.showData.set(res.data);
      this.loading.set(false);
    });
  }

  toggleSeat(seat: SeatInfo): void {
    if (seat.isBooked) return;
    const current = new Set(this.selectedSeatIds());
    if (current.has(seat.id)) {
      current.delete(seat.id);
    } else {
      current.add(seat.id);
    }
    this.selectedSeatIds.set(current);
  }

  isSeatSelected(id: number): boolean {
    return this.selectedSeatIds().has(id);
  }

  seatTypeClass(seat: SeatInfo): string {
    if (seat.isBooked) return 'booked';
    if (this.isSeatSelected(seat.id)) return 'selected';
    if (seat.seatType === 3) return 'vip';
    if (seat.seatType === 2) return 'premium';
    return 'standard';
  }

  proceedToFnb(): void {
    if (this.selectedSeatIds().size === 0) return;
    this.errorMsg.set('');
    this.api.getAvailableConcessions().subscribe(res => {
      this.concessions.set(res.data ?? []);
      this.step.set(2);
    });
  }

  getCartQty(id: number): number {
    return this.concessionCart().get(id) ?? 0;
  }

  updateCart(item: ConcessionItem, delta: number): void {
    const cart = new Map(this.concessionCart());
    const current = cart.get(item.id) ?? 0;
    const next = current + delta;
    if (next <= 0) {
      cart.delete(item.id);
    } else if (next <= item.stockCount) {
      cart.set(item.id, next);
    }
    this.concessionCart.set(cart);
  }

  proceedToSummary(): void {
    this.step.set(3);
  }

  confirmBooking(): void {
    const data = this.showData();
    if (!data) return;
    this.submitting.set(true);
    this.errorMsg.set('');

    const concessionItems: BookingConcessionItem[] = [];
    this.concessionCart().forEach((qty, id) => {
      concessionItems.push({ concessionItemId: id, quantity: qty });
    });

    this.api.checkout({
      showId: data.showId,
      seatIds: [...this.selectedSeatIds()],
      concessionItems
    }).subscribe({
      next: res => {
        if (res.success) {
          this.bookingResult.set(res.data);
          this.router.navigate(['/booking/confirmation', res.data.id]);
        } else {
          this.errorMsg.set(res.message);
          this.submitting.set(false);
        }
      },
      error: () => {
        this.errorMsg.set('Something went wrong. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  goBack(): void {
    if (this.step() === 2) { this.step.set(1); return; }
    if (this.step() === 3) { this.step.set(2); return; }
    this.router.navigate(['../..'], { relativeTo: this.route });
  }
}
