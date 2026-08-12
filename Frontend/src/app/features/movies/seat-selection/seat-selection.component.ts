import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { interval, Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SeatInfo, ShowSeatsResponse, ConcessionItem, BookingConcessionItem, BookingResponse } from '../../../core/models/models';

interface SeatRowGroup {
  rowLabel: string;
  seats: SeatInfo[];
}

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  showData = signal<ShowSeatsResponse | null>(null);
  concessions = signal<ConcessionItem[]>([]);
  loading = signal(true);
  submitting = signal(false);
  errorMsg = signal('');
  step = signal<1 | 2 | 3>(1);

  selectedSeatIds = signal<Set<number>>(new Set());
  concessionCart = signal<Map<number, number>>(new Map());
  selectedPayment = signal<string>('upi');
  bookingResult = signal<BookingResponse | null>(null);

  lockTimer = signal<number | null>(null);
  timerExpired = signal(false);
  private timerSub: Subscription | null = null;
  private lockingInProgress = new Set<number>();

  rowGroups = computed<SeatRowGroup[]>(() => {
    const data = this.showData();
    if (!data) return [];

    const rowLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
    const groups: SeatRowGroup[] = [];

    // Map 0-indexed rows to letters (0 = A, 1 = B...)
    for (let r = 0; r < data.totalRows; r++) {
      const rowSeats = data.seats.filter(s => s.row === r).sort((a, b) => a.column - b.column);
      if (rowSeats.length === 0) continue;

      const label = rowLetters[r] || `R${r + 1}`;
      groups.push({ rowLabel: label, seats: rowSeats });
    }

    return groups;
  });

  selectedSeats = computed(() =>
    (this.showData()?.seats ?? []).filter(s => this.selectedSeatIds().has(s.id))
  );

  selectedSeatNumbersStr = computed(() =>
    this.selectedSeats().map(s => s.seatNumber).join(', ')
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

  timerDisplay = computed(() => {
    const t = this.lockTimer();
    if (t === null) return null;
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  ngOnInit(): void {
    const showId = Number(this.route.snapshot.paramMap.get('showId'));
    this.api.getShowSeats(showId).subscribe(res => {
      this.showData.set(res.data);
      this.loading.set(false);
    });
  }

  ngOnDestroy(): void {
    this.releaseAllLocks();
    this.stopTimer();
  }

  toggleSeat(seat: SeatInfo): void {
    if (seat.isBooked || this.lockingInProgress.has(seat.id)) return;

    const current = new Set(this.selectedSeatIds());

    if (current.has(seat.id)) {
      current.delete(seat.id);
      this.selectedSeatIds.set(current);
      this.unlockSeat(seat.id);

      if (current.size === 0) {
        this.stopTimer();
        this.lockTimer.set(null);
      }
      return;
    }

    this.lockingInProgress.add(seat.id);
    this.errorMsg.set('');

    const showId = this.showData()!.showId;
    this.api.lockSeats({ showId, seatIds: [seat.id] }).subscribe({
      next: res => {
        this.lockingInProgress.delete(seat.id);
        if (res.success) {
          const updated = new Set(this.selectedSeatIds());
          updated.add(seat.id);
          this.selectedSeatIds.set(updated);
          this.startOrResetTimer(res.data.expiresInSeconds);
        } else {
          this.errorMsg.set('This seat was just taken by someone else.');
        }
      },
      error: err => {
        this.lockingInProgress.delete(seat.id);
        if (err.status === 409) {
          this.errorMsg.set('This seat is currently selected by another user.');
        } else {
          this.errorMsg.set('Could not lock seat. Please try again.');
        }
      }
    });
  }

  isSeatSelected(id: number): boolean {
    return this.selectedSeatIds().has(id);
  }

  seatTypeClass(seat: SeatInfo): string {
    if (seat.isBooked) return 'booked';
    if (this.lockingInProgress.has(seat.id)) return 'locking';
    if (this.isSeatSelected(seat.id)) return 'selected';
    if (seat.seatType === 3) return 'vip';
    if (seat.seatType === 2) return 'premium';
    return 'standard';
  }

  getConcessionIcon(item: ConcessionItem): string {
    const name = item.itemName.toLowerCase();
    if (name.includes('popcorn')) return '🍿';
    if (name.includes('coke') || name.includes('pepsi') || name.includes('drink') ||
        name.includes('soda') || name.includes('beverage') || name.includes('cola') ||
        name.includes('juice') || name.includes('water')) return '🥤';
    if (name.includes('nacho') || name.includes('cheese')) return '🧀';
    if (name.includes('hot') || name.includes('dog')) return '🌭';
    return '🥤';
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

  proceedToPayment(): void {
    this.step.set(3);
  }

  setPaymentMethod(method: string): void {
    this.selectedPayment.set(method);
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
          this.stopTimer();
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
    this.releaseAllLocks();
    this.router.navigate(['../..'], { relativeTo: this.route });
  }

  private startOrResetTimer(seconds: number): void {
    this.stopTimer();
    this.lockTimer.set(seconds);

    this.timerSub = interval(1000).subscribe(() => {
      const current = this.lockTimer();
      if (current === null || current <= 0) {
        this.onTimerExpired();
        return;
      }
      this.lockTimer.set(current - 1);
    });
  }

  private stopTimer(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = null;
  }

  private onTimerExpired(): void {
    this.stopTimer();
    this.lockTimer.set(null);
    this.selectedSeatIds.set(new Set());
    this.concessionCart.set(new Map());
    this.step.set(1);
    this.timerExpired.set(true);
  }

  dismissExpiredModal(): void {
    this.timerExpired.set(false);
  }

  private unlockSeat(seatId: number): void {
    const showId = this.showData()?.showId;
    if (!showId) return;
    this.api.unlockSeats({ showId, seatIds: [seatId] }).subscribe();
  }

  private releaseAllLocks(): void {
    const showId = this.showData()?.showId;
    const seatIds = [...this.selectedSeatIds()];
    if (!showId || seatIds.length === 0) return;
    this.api.unlockSeats({ showId, seatIds }).subscribe();
  }
}
