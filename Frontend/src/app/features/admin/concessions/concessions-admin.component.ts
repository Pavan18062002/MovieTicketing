import { Component, inject, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SignalRService, LowStockAlertEvent } from '../../../core/services/signalr.service';
import { ConcessionItem, Theater } from '../../../core/models/models';
import { StockDialogComponent } from './stock-dialog.component';

@Component({
  selector: 'app-concessions-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  templateUrl: './concessions-admin.component.html',
  styleUrl: './concessions-admin.component.css'
})
export class ConcessionsAdminComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private signalr = inject(SignalRService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private sub = new Subscription();

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  items = signal<ConcessionItem[]>([]);
  theaters = signal<Theater[]>([]);
  selectedFilterTheaterId = signal<number | null>(null);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<number | null>(null);
  cols = ['name', 'theater', 'size', 'price', 'stock', 'actions'];

  activeAlert = signal<LowStockAlertEvent | null>(null);
  alertDismissed = signal<boolean>(false);

  form = this.fb.group({
    itemName: ['', Validators.required],
    itemSize: ['', Validators.required],
    category: [1, Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    stockCount: [0, [Validators.required, Validators.min(0)]],
    theaterId: [null as number | null]
  });

  ngOnInit(): void {
    this.api.adminGetTheaters().subscribe({
      next: res => {
        if (res.success && res.data) {
          this.theaters.set(res.data);
          if (res.data.length > 0 && !this.form.value.theaterId) {
            this.form.patchValue({ theaterId: res.data[0].id });
          }
        }
      }
    });

    this.load();

    this.signalr.startAdminConnection();

    // Listen for live stock decrements from checkouts
    this.sub.add(
      this.signalr.lowStockAlert$.subscribe(alert => {
        this.alertDismissed.set(false);

        // 1. Set top alert banner on concessions page
        this.activeAlert.set(alert);

        // 2. Update table row in real-time
        this.items.update(list =>
          list.map(item =>
            item.id === alert.concessionItemId
              ? { ...item, stockCount: alert.currentStock, isLowStock: true }
              : item
          )
        );

        // 3. Display instant popup toast notification on Admin screen
        const snackRef = this.snack.open(
          `⚠️ Low Stock Alert: ${alert.itemName} (${alert.itemSize}) only has ${alert.currentStock} left!`,
          'Restock Now',
          {
            duration: 8000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: ['admin-low-stock-toast']
          }
        );

        snackRef.onAction().subscribe(() => {
          this.openStockForAlert();
        });
      })
    );
  }

  load(): void {
    this.loading.set(true);
    const tid = this.selectedFilterTheaterId() ?? undefined;
    this.api.adminGetConcessions(tid).subscribe(res => {
      const list = res.data ?? [];
      this.items.set(list);
      this.loading.set(false);

      // If any item is low in stock and banner is not dismissed, show it right away
      if (!this.activeAlert() && !this.alertDismissed()) {
        const lowItem = list.find(i => i.stockCount <= 5 || i.isLowStock);
        if (lowItem) {
          this.activeAlert.set({
            concessionItemId: lowItem.id,
            itemName: lowItem.itemName + (lowItem.theaterName ? ` (${lowItem.theaterName})` : ''),
            itemSize: lowItem.itemSize,
            currentStock: lowItem.stockCount,
            baseStock: lowItem.baseStockCount,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  }

  dismissAlert(): void {
    this.alertDismissed.set(true);
    this.activeAlert.set(null);
  }

  filterByTheater(theaterId: number | null): void {
    this.selectedFilterTheaterId.set(theaterId);
    this.load();
  }

  startEdit(item: ConcessionItem): void {
    this.editingId.set(item.id);
    this.form.patchValue({
      itemName: item.itemName,
      itemSize: item.itemSize,
      category: item.category,
      price: item.price,
      theaterId: item.theaterId ?? null
    });
    this.form.get('stockCount')!.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.get('stockCount')!.enable();
    const defaultTheater = this.theaters().length > 0 ? this.theaters()[0].id : null;
    this.form.reset({ category: 1, price: 0, stockCount: 0, theaterId: defaultTheater });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    if (this.editingId()) {
      const payload = {
        itemName: this.form.value.itemName!,
        itemSize: this.form.value.itemSize!,
        category: this.form.value.category!,
        price: this.form.value.price!,
        theaterId: this.form.value.theaterId ?? null
      };
      this.api.adminUpdateConcession(this.editingId()!, payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Item updated!', 'OK', { duration: 3000 });
            this.cancelEdit();
            this.load();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Update failed', 'Close', { duration: 4000 });
        }
      });
    } else {
      const payload = {
        itemName: this.form.value.itemName!,
        itemSize: this.form.value.itemSize!,
        category: this.form.value.category!,
        price: this.form.value.price!,
        stockCount: this.form.value.stockCount!,
        theaterId: this.form.value.theaterId ?? null
      };
      this.api.adminCreateConcession(payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Item added!', 'OK', { duration: 3000 });
            const defaultTheater = this.theaters().length > 0 ? this.theaters()[0].id : null;
            this.formDirective.resetForm({ category: 1, price: 0, stockCount: 0, theaterId: defaultTheater });
            this.load();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Failed to add item', 'Close', { duration: 4000 });
        }
      });
    }
  }

  openStock(item: ConcessionItem): void {
    const ref = this.dialog.open(StockDialogComponent, {
      width: '350px',
      data: { item }
    });

    ref.afterClosed().subscribe(newStock => {
      if (newStock !== undefined && newStock !== null) {
        this.api.adminUpdateStock(item.id, newStock).subscribe(res => {
          if (res.success) {
            this.snack.open('Stock updated', 'OK', { duration: 2500 });
            this.load();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  openStockForAlert(): void {
    const alert = this.activeAlert();
    if (!alert) return;
    const item = this.items().find(i => i.id === alert.concessionItemId) ?? {
      id: alert.concessionItemId,
      itemName: alert.itemName,
      itemSize: alert.itemSize,
      stockCount: alert.currentStock
    } as any;

    const ref = this.dialog.open(StockDialogComponent, {
      width: '380px',
      data: { item }
    });

    ref.afterClosed().subscribe(newStock => {
      if (newStock !== undefined && newStock !== null) {
        this.api.adminUpdateStock(alert.concessionItemId, newStock).subscribe(res => {
          if (res.success) {
            this.snack.open('Stock updated successfully!', 'OK', { duration: 3000 });
            this.activeAlert.set(null);
            this.load();
          } else {
            this.snack.open(res.message || 'Failed to update stock', 'Close', { duration: 4000 });
          }
        });
      }
    });
  }

  deleteItem(id: number): void {
    if (confirm('Are you sure you want to delete this item?')) {
      this.api.adminDeleteConcession(id).subscribe(res => {
        if (res.success) {
          this.snack.open('Item deleted', 'OK', { duration: 3000 });
          this.load();
        } else {
          this.snack.open(res.message, 'Close', { duration: 4000 });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
