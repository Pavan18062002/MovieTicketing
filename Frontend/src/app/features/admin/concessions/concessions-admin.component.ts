import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { ApiService } from '../../../core/services/api.service';
import { ConcessionItem } from '../../../core/models/models';
import { StockDialogComponent } from './stock-dialog.component';

@Component({
  selector: 'app-concessions-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule
  ],
  templateUrl: './concessions-admin.component.html',
  styleUrl: './concessions-admin.component.css'
})
export class ConcessionsAdminComponent implements OnInit {
  private api    = inject(ApiService);
  private fb     = inject(FormBuilder);
  private snack  = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  items     = signal<ConcessionItem[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  editingId = signal<number | null>(null);
  cols = ['name', 'size', 'price', 'stock', 'actions'];

  form = this.fb.group({
    itemName:   ['', Validators.required],
    itemSize:   ['', Validators.required],
    category:   [0, Validators.required],
    price:      [0, [Validators.required, Validators.min(0.01)]],
    stockCount: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.adminGetConcessions().subscribe(res => {
      this.items.set(res.data ?? []);
      this.loading.set(false);
    });
  }

  startEdit(item: ConcessionItem): void {
    this.editingId.set(item.id);
    this.form.patchValue({
      itemName: item.itemName,
      itemSize: item.itemSize,
      category: item.category,
      price:    item.price
    });
    this.form.get('stockCount')!.disable(); // Stock is updated via dialog only for existing items
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.get('stockCount')!.enable();
    this.form.reset({ category: 0, price: 0, stockCount: 0 });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    if (this.editingId()) {
      const payload = {
        itemName: this.form.value.itemName!,
        itemSize: this.form.value.itemSize!,
        category: this.form.value.category!,
        price:    this.form.value.price!
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
        itemName:   this.form.value.itemName!,
        itemSize:   this.form.value.itemSize!,
        category:   this.form.value.category!,
        price:      this.form.value.price!,
        stockCount: this.form.value.stockCount!
      };
      this.api.adminCreateConcession(payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Item added!', 'OK', { duration: 3000 });
            this.form.reset({ category: 0, price: 0, stockCount: 0 });
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
}
