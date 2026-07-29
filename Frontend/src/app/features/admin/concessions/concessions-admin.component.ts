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
  template: `
    <div class="page-header">
      <h1>Manage Concessions</h1>
      @if (editingId()) {
        <button class="btn-add-new" (click)="cancelEdit()">
          + Add New Item
        </button>
      }
    </div>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editingId() ? 'Edit Item' : 'Add New Item' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Item Name</mat-label>
            <input matInput formControlName="itemName">
            @if (form.get('itemName')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Size/Type</mat-label>
            <input matInput formControlName="itemSize" placeholder="e.g. Large, 500ml">
            @if (form.get('itemSize')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select formControlName="category">
              <!-- Assuming 0: Popcorn, 1: ColdDrink, 2: Snack, 3: Combo based on backend Enum -->
              <mat-option [value]="0">Popcorn</mat-option>
              <mat-option [value]="1">Cold Drink</mat-option>
              <mat-option [value]="2">Snack</mat-option>
              <mat-option [value]="3">Combo</mat-option>
            </mat-select>
            @if (form.get('category')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Price (₹)</mat-label>
            <input matInput type="number" formControlName="price">
            @if (form.get('price')?.hasError('required')) { <mat-error>Required</mat-error> }
            @if (form.get('price')?.hasError('min')) { <mat-error>Must be > 0</mat-error> }
          </mat-form-field>

          @if (!editingId()) {
            <mat-form-field appearance="outline" class="span-full">
              <mat-label>Initial Stock Count</mat-label>
              <input matInput type="number" formControlName="stockCount">
              <mat-hint>Can be updated later via Quick Actions</mat-hint>
              @if (form.get('stockCount')?.hasError('required')) { <mat-error>Required</mat-error> }
              @if (form.get('stockCount')?.hasError('min')) { <mat-error>Cannot be negative</mat-error> }
            </mat-form-field>
          }

          <div class="span-full actions-row">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="18" /> }
              @else { {{ editingId() ? 'Save Changes' : 'Add Item' }} }
            </button>
            @if (editingId()) {
              <button mat-button type="button" (click)="cancelEdit()">Cancel</button>
            }
          </div>
        </form>
      </mat-card-content>
    </mat-card>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <mat-card>
        <table mat-table [dataSource]="items()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Item Name</th>
            <td mat-cell *matCellDef="let c">
              <div class="item-name">{{ c.itemName }}</div>
              <div class="item-cat">{{ c.categoryName }}</div>
            </td>
          </ng-container>
          <ng-container matColumnDef="size">
            <th mat-header-cell *matHeaderCellDef>Size</th>
            <td mat-cell *matCellDef="let c">{{ c.itemSize }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let c">₹{{ c.price }}</td>
          </ng-container>
          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let c">
              <span class="stock-badge" [class.low]="c.isLowStock" [class.out]="c.stockCount === 0">
                {{ c.stockCount }}
                @if (c.stockCount === 0) {
                  (Out)
                } @else if (c.isLowStock) {
                  (Low)
                }
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button color="primary" (click)="openStock(c)" title="Update stock">
                <mat-icon>inventory</mat-icon>
              </button>
              <button mat-icon-button color="primary" (click)="startEdit(c)" title="Edit details">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteItem(c.id)" title="Delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;" [class.out-row]="row.stockCount === 0"></tr>
        </table>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .page-header h1 { margin: 0; color: #1e293b; font-weight: 800; }
    .btn-add-new {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 8px;
      padding: 9px 20px; font-size: 0.88rem; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }
    .btn-add-new:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.45); }
    .form-card { margin-bottom: 24px; border-radius: 12px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .span-full { grid-column: 1 / -1; }
    .actions-row { display: flex; gap: 12px; align-items: center; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }

    .item-name { font-weight: 600; color: #1e293b; }
    .item-cat { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

    .stock-badge {
      display: inline-block; padding: 4px 8px; border-radius: 4px;
      background: #e2e8f0; color: #334155; font-weight: 600; font-size: 0.85rem;
    }
    .stock-badge.low { background: #fef08a; color: #854d0e; }
    .stock-badge.out { background: #fecaca; color: #991b1b; }
    .out-row { opacity: 0.7; }

    mat-form-field { width: 100%; }
  `]
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
