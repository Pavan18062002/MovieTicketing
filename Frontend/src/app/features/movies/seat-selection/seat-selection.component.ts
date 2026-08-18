import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, interval } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { ShowSeatsResponse, SeatInfo, ConcessionItem, BookingConcessionItem, BookingResponse } from '../../../core/models/models';

export interface SeatRowGroup {
  rowLabel: string;
  seats: SeatInfo[];
}

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './seat-selection.component.html',
  styleUrl: './seat-selection.component.css'
})
export class SeatSelectionComponent implements OnInit, OnDestroy {
  private api     = inject(ApiService);
  private auth    = inject(AuthService);
  private signalr = inject(SignalRService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);

  showData = signal<ShowSeatsResponse | null>(null);
  loading = signal(true);
  submitting = signal(false);
  errorMsg = signal('');

  step = signal<1 | 2 | 3>(1); // 1 = Seat Grid, 2 = Food & Beverage, 3 = Payment Options

  selectedSeatIds = signal<Set<number>>(new Set());
  otherUserLockedSeatIds = signal<Set<number>>(new Set());
  concessions = signal<ConcessionItem[]>([]);
  concessionCart = signal<Map<number, number>>(new Map());
  selectedPayment = signal<string>('upi');
  bookingResult = signal<BookingResponse | null>(null);

  // Payment Gateway fields
  upiId = signal<string>('');
  upiMode = signal<'id' | 'qr'>('id');
  cardNumber = signal<string>('');
  cardExpiry = signal<string>('');
  cardCvv = signal<string>('');
  cardName = signal<string>('');
  selectedBank = signal<string>('HDFC Bank');
  selectedWallet = signal<string>('Paytm Wallet');

  // Gateway live status overlay
  gatewayProcessing = signal<boolean>(false);
  gatewayStatus = signal<string>('');

  lockTimer = signal<number | null>(null);
  timerExpired = signal(false);
  private timerSub: Subscription | null = null;
  private signalRSubs = new Subscription();
  private lockingInProgress = new Set<number>();

  getRowLabel(rowIndex: number): string {
    let label = '';
    let temp = rowIndex;
    while (temp >= 0) {
      label = String.fromCharCode((temp % 26) + 65) + label;
      temp = Math.floor(temp / 26) - 1;
    }
    return label;
  }

  rowGroups = computed<SeatRowGroup[]>(() => {
    const data = this.showData();
    if (!data) return [];

    const groups: SeatRowGroup[] = [];

    for (let r = 0; r < data.totalRows; r++) {
      const rowSeats = data.seats.filter(s => s.row === r).sort((a, b) => a.column - b.column);
      if (rowSeats.length === 0) continue;

      const label = this.getRowLabel(r);
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
    
    // 1. Load initial seat grid
    this.api.getShowSeats(showId).subscribe(res => {
      this.showData.set(res.data);
      this.loading.set(false);
    });

    // 2. Connect to SignalR group for live seat synchronization
    this.signalr.joinShowGroup(showId);

    // Listen for live seat lock events from other clients
    this.signalRSubs.add(
      this.signalr.seatsLocked$.subscribe(event => {
        if (event.showId === showId) {
          const myUserId = this.auth.getUserId();
          if (event.lockedByUserId && myUserId && event.lockedByUserId === myUserId) {
            return;
          }
          const locked = new Set(this.otherUserLockedSeatIds());
          event.seatIds.forEach(id => {
            if (!this.selectedSeatIds().has(id)) {
              locked.add(id);
            }
          });
          this.otherUserLockedSeatIds.set(locked);
        }
      })
    );

    // Listen for live seat unlock events
    this.signalRSubs.add(
      this.signalr.seatsUnlocked$.subscribe(event => {
        if (event.showId === showId) {
          const locked = new Set(this.otherUserLockedSeatIds());
          event.seatIds.forEach(id => locked.delete(id));
          this.otherUserLockedSeatIds.set(locked);
        }
      })
    );

    // Listen for live seat booking events
    this.signalRSubs.add(
      this.signalr.seatsBooked$.subscribe(event => {
        if (event.showId === showId) {
          const locked = new Set(this.otherUserLockedSeatIds());
          event.seatIds.forEach(id => locked.delete(id));
          this.otherUserLockedSeatIds.set(locked);

          const currentShow = this.showData();
          if (currentShow) {
            const updatedSeats = currentShow.seats.map(s =>
              event.seatIds.includes(s.id) ? { ...s, isBooked: true } : s
            );
            this.showData.set({ ...currentShow, seats: updatedSeats });
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    const showId = Number(this.route.snapshot.paramMap.get('showId'));
    this.signalr.leaveShowGroup(showId);
    this.signalRSubs.unsubscribe();
    this.stopTimer();
    this.releaseAllLocks();
  }

  toggleSeat(seat: SeatInfo): void {
    if (seat.isBooked || this.otherUserLockedSeatIds().has(seat.id) || this.lockingInProgress.has(seat.id)) {
      return;
    }

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
    if (this.isSeatSelected(seat.id)) return 'selected';
    if (seat.isBooked) return 'booked';
    if (this.otherUserLockedSeatIds().has(seat.id)) return 'locked-other';
    if (this.lockingInProgress.has(seat.id)) return 'locking';
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
    const theaterId = this.showData()?.theaterId;
    this.api.getAvailableConcessions(theaterId).subscribe(res => {
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
    this.errorMsg.set('');
  }

  confirmBooking(): void {
    const data = this.showData();
    if (!data) return;
    this.errorMsg.set('');

    // 1. Strict Payment Validation
    if (this.selectedPayment() === 'upi') {
      if (this.upiMode() === 'id') {
        const id = this.upiId().trim();
        if (!id) {
          this.errorMsg.set('Please enter your UPI ID (e.g. yourname@upi or mobile@okhdfcbank).');
          return;
        }
        if (!id.includes('@') || id.length < 5) {
          this.errorMsg.set('Please enter a valid UPI ID containing "@" (e.g. name@okhdfcbank).');
          return;
        }
      }
    } else if (this.selectedPayment() === 'card') {
      const rawCard = this.cardNumber().replace(/\s/g, '');
      if (!rawCard || rawCard.length < 12) {
        this.errorMsg.set('Please enter a valid 16-digit Card Number.');
        return;
      }
      if (!this.cardExpiry().trim() || this.cardExpiry().trim().length < 4) {
        this.errorMsg.set('Please enter Card Expiry (MM/YY).');
        return;
      }
      if (!this.cardCvv().trim() || this.cardCvv().trim().length < 3) {
        this.errorMsg.set('Please enter a valid 3-digit CVV.');
        return;
      }
      if (!this.cardName().trim()) {
        this.errorMsg.set('Please enter the Cardholder Name.');
        return;
      }
    } else if (this.selectedPayment() === 'netbanking') {
      if (!this.selectedBank()) {
        this.errorMsg.set('Please select your Bank for Net Banking.');
        return;
      }
    } else if (this.selectedPayment() === 'wallets') {
      if (!this.selectedWallet()) {
        this.errorMsg.set('Please select a Wallet.');
        return;
      }
    }

    this.submitting.set(true);
    this.gatewayProcessing.set(true);
    this.gatewayStatus.set('🔒 Securely Connecting to Payment Gateway...');

    const concessionItems: BookingConcessionItem[] = [];
    this.concessionCart().forEach((qty, id) => {
      concessionItems.push({ concessionItemId: id, quantity: qty });
    });

    setTimeout(() => {
      const methodLabel = this.selectedPayment() === 'upi' ? 'UPI (GPay/PhonePe)' :
                          this.selectedPayment() === 'card' ? 'Credit Card (Visa)' :
                          this.selectedPayment() === 'netbanking' ? this.selectedBank() : 'Wallet';

      this.gatewayStatus.set(`Authorizing ₹${this.grandTotal()} with ${methodLabel}...`);

      setTimeout(() => {
        const txnId = 'TXN_' + Math.floor(100000000 + Math.random() * 900000000);
        this.gatewayStatus.set(`✅ Payment Approved! (${txnId})`);

        setTimeout(() => {
          this.api.checkout({
            showId: data.showId,
            seatIds: [...this.selectedSeatIds()],
            concessionItems
          }).subscribe({
            next: res => {
              this.gatewayProcessing.set(false);
              if (res.success) {
                this.stopTimer();
                this.bookingResult.set(res.data);
                this.router.navigate(['/booking/confirmation', res.data.id]);
              } else {
                this.errorMsg.set(res.message);
                this.submitting.set(false);
              }
            },
            error: err => {
              this.gatewayProcessing.set(false);
              this.errorMsg.set(err.error?.message || 'Something went wrong with the transaction.');
              this.submitting.set(false);
            }
          });
        }, 500);
      }, 700);
    }, 600);
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
