import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { SeatInfo, ShowSeatsResponse, ConcessionItem, BookingConcessionItem, BookingResponse } from '../../../core/models/models';

// Represents seats grouped by row for continuous rendering
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
export class SeatSelectionComponent implements OnInit {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  // State signals for current show, available concessions, and loading status
  showData       = signal<ShowSeatsResponse | null>(null);
  concessions    = signal<ConcessionItem[]>([]);
  loading        = signal(true);
  submitting     = signal(false);
  errorMsg       = signal('');
  step           = signal<1 | 2 | 3>(1); // Step 1: Seats, Step 2: F&B, Step 3: Payment

  // User selections
  selectedSeatIds = signal<Set<number>>(new Set());
  concessionCart  = signal<Map<number, number>>(new Map());
  selectedPayment = signal<string>('upi');
  bookingResult   = signal<BookingResponse | null>(null);

  // Groups screen seats into rows and aisle sections (left, center, right)
  rowGroups = computed<SeatRowGroup[]>(() => {
    const data = this.showData();
    if (!data) return [];

    const rowLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'];
    const groups: SeatRowGroup[] = [];

    // Backend stores rows 0-indexed (row 0 = A, row 1 = B, etc.)
    for (let r = 0; r < data.totalRows; r++) {
      const rowSeats = data.seats.filter(s => s.row === r).sort((a, b) => a.column - b.column);

      // Skip rows that have no seats at all (data inconsistency guard)
      if (rowSeats.length === 0) continue;

      const label = rowLetters[r] || `R${r + 1}`;

      groups.push({
        rowLabel: label,
        seats: rowSeats
      });
    }

    return groups;
  });

  // Returns list of seat objects selected by the user
  selectedSeats = computed(() =>
    (this.showData()?.seats ?? []).filter(s => this.selectedSeatIds().has(s.id))
  );

  // Comma-separated seat numbers string (e.g. "A1, A2")
  selectedSeatNumbersStr = computed(() =>
    this.selectedSeats().map(s => s.seatNumber).join(', ')
  );

  // Calculates subtotal for chosen ticket seats
  ticketsTotal = computed(() =>
    this.selectedSeats().reduce((sum, s) => sum + s.price, 0)
  );

  // Calculates subtotal for chosen snacks and beverages
  concessionsTotal = computed(() => {
    let total = 0;
    this.concessionCart().forEach((qty, id) => {
      const item = this.concessions().find(c => c.id === id);
      if (item) total += item.price * qty;
    });
    return total;
  });

  // Calculates grand total (tickets + food & beverages)
  grandTotal = computed(() => this.ticketsTotal() + this.concessionsTotal());

  ngOnInit(): void {
    const showId = Number(this.route.snapshot.paramMap.get('showId'));
    this.api.getShowSeats(showId).subscribe(res => {
      this.showData.set(res.data);
      this.loading.set(false);
    });
  }

  // Toggles seat selection on/off when clicked
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

  // Returns CSS class name based on booking status and seat tier.
  // Backend enum: Standard = 1, Premium = 2, VIP = 3
  seatTypeClass(seat: SeatInfo): string {
    if (seat.isBooked) return 'booked';
    if (this.isSeatSelected(seat.id)) return 'selected';
    if (seat.seatType === 3) return 'vip';       // VIP — top tier
    if (seat.seatType === 2) return 'premium';   // Premium — mid tier
    return 'standard';                           // Standard — base tier (was 'available')
  }

  // Maps concession item names to matching visual emojis
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

  // Advances to Step 2 (Food & Beverages) after selecting seats
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

  // Adds or removes items from snack cart
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

  // Advances to Step 3 (Payment)
  proceedToPayment(): void {
    this.step.set(3);
  }

  setPaymentMethod(method: string): void {
    this.selectedPayment.set(method);
  }

  // Submits complete booking to backend transactional checkout API
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

  // Handles back button navigation between workflow steps
  goBack(): void {
    if (this.step() === 2) { this.step.set(1); return; }
    if (this.step() === 3) { this.step.set(2); return; }
    this.router.navigate(['../..'], { relativeTo: this.route });
  }
}
