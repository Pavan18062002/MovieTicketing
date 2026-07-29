import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Screen } from '../../../core/models/models';

@Component({
  selector: 'app-screens-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>Manage Screens</h1>
      @if (editingId()) {
        <button class="btn-add-new" (click)="cancelEdit()">
          + Add New Screen
        </button>
      }
    </div>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editingId() ? 'Edit Screen' : 'Add New Screen' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <mat-form-field appearance="outline" class="span-full">
            <mat-label>Screen Name</mat-label>
            <input matInput formControlName="name">
            @if (form.get('name')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          @if (!editingId()) {
            <mat-form-field appearance="outline">
              <mat-label>Total Rows</mat-label>
              <input matInput type="number" formControlName="totalRows">
              @if (form.get('totalRows')?.hasError('required')) { <mat-error>Required</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Total Columns</mat-label>
              <input matInput type="number" formControlName="totalColumns">
              @if (form.get('totalColumns')?.hasError('required')) { <mat-error>Required</mat-error> }
            </mat-form-field>
          }

          <div class="span-full actions-row">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="18" /> }
              @else { {{ editingId() ? 'Save Changes' : 'Add Screen' }} }
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
        <table mat-table [dataSource]="screens()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let s">{{ s.name }}</td>
          </ng-container>
          <ng-container matColumnDef="capacity">
            <th mat-header-cell *matHeaderCellDef>Capacity</th>
            <td mat-cell *matCellDef="let s">{{ s.capacity }} seats</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button color="primary" (click)="startEdit(s)" title="Edit screen">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteScreen(s.id)" title="Delete screen">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"></tr>
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
    mat-form-field { width: 100%; }
  `]
})
export class ScreensAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  screens   = signal<Screen[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  editingId = signal<number | null>(null);
  cols = ['name', 'capacity', 'actions'];

  form = this.fb.group({
    name:         ['', Validators.required],
    totalRows:    [10, [Validators.required, Validators.min(1)]],
    totalColumns: [10, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.adminGetScreens().subscribe(res => {
      this.screens.set(res.data ?? []);
      this.loading.set(false);
    });
  }

  startEdit(screen: Screen): void {
    this.editingId.set(screen.id);
    this.form.patchValue({
      name: screen.name
    });
    // Rows/Columns cannot be updated after creation in this system, so disable them
    this.form.get('totalRows')!.disable();
    this.form.get('totalColumns')!.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.get('totalRows')!.enable();
    this.form.get('totalColumns')!.enable();
    this.form.reset({ totalRows: 10, totalColumns: 10 });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    if (this.editingId()) {
      this.api.adminUpdateScreen(this.editingId()!, { name: this.form.value.name! }).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Screen updated!', 'OK', { duration: 3000 });
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
      this.api.adminCreateScreen(this.form.value as any).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Screen added!', 'OK', { duration: 3000 });
            this.form.reset({ totalRows: 10, totalColumns: 10 });
            this.load();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Failed to add screen', 'Close', { duration: 4000 });
        }
      });
    }
  }

  deleteScreen(id: number): void {
    this.api.adminDeleteScreen(id).subscribe(res => {
      if (res.success) {
        this.snack.open('Screen deleted', 'OK', { duration: 3000 });
        this.load();
      } else {
        this.snack.open(res.message, 'Close', { duration: 4000 });
      }
    });
  }
}
