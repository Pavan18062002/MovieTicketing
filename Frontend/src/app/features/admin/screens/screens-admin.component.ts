import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
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
  templateUrl: './screens-admin.component.html',
  styleUrl: './screens-admin.component.css'
})
export class ScreensAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  screens   = signal<Screen[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  editingId = signal<number | null>(null);
  cols = ['name', 'capacity', 'actions'];

  form = this.fb.group({
    name:              ['', Validators.required],
    totalRows:         [10, [Validators.required, Validators.min(1)]],
    totalColumns:      [10, [Validators.required, Validators.min(1)]],
    premiumRows:       [5, [Validators.required, Validators.min(0)]],
    vipRows:           [2, [Validators.required, Validators.min(0)]],
    premiumMultiplier: [1.3, [Validators.required, Validators.min(1.0), Validators.max(5.0)]],
    vipMultiplier:     [1.6, [Validators.required, Validators.min(1.0), Validators.max(5.0)]]
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
    this.form.reset({ totalRows: 10, totalColumns: 10, premiumRows: 5, vipRows: 2, premiumMultiplier: 1.3, vipMultiplier: 1.6 });
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
            this.form.get('totalRows')!.enable();
            this.form.get('totalColumns')!.enable();
            this.formDirective.resetForm({ totalRows: 10, totalColumns: 10 });
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
