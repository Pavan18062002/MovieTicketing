import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ConcessionItem } from '../../../core/models/models';

@Component({
  selector: 'app-stock-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title style="color: #ffffff;">Update Stock — {{ data.item.itemName }} ({{ data.item.itemSize }})</h2>
    <mat-dialog-content style="color: #ffffff;">
      <p>Current stock: <strong>{{ data.item.stockCount }}</strong></p>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>New Stock Count</mat-label>
        <input matInput type="number" [formControl]="ctrl">
        @if (ctrl.hasError('min')) { <mat-error>Must be 0 or more</mat-error> }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="ctrl.invalid">Save</button>
    </mat-dialog-actions>
  `
})
export class StockDialogComponent {
  data: { item: ConcessionItem } = inject(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<StockDialogComponent>);
  private fb  = inject(FormBuilder);

  ctrl = this.fb.control(this.data.item.stockCount, [Validators.required, Validators.min(0)]);

  save(): void { this.ref.close(this.ctrl.value); }
}
