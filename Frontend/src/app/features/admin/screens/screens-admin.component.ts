import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Screen, Theater } from '../../../core/models/models';

@Component({
  selector: 'app-screens-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  templateUrl: './screens-admin.component.html',
  styleUrl: './screens-admin.component.css'
})
export class ScreensAdminComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  screens = signal<Screen[]>([]);
  theaters = signal<Theater[]>([]);
  loading = signal(true);
  saving = signal(false);
  editingId = signal<number | null>(null);
  cols = ['name', 'theater', 'capacity', 'actions'];

  form = this.fb.group({
    name: ['', Validators.required],
    theaterId: [null as number | null],
    totalRows: [10, [Validators.required, Validators.min(1)]],
    totalColumns: [10, [Validators.required, Validators.min(1)]],
    premiumRows: [5, [Validators.required, Validators.min(0)]],
    vipRows: [2, [Validators.required, Validators.min(0)]],
    premiumMultiplier: [1.3, [Validators.required, Validators.min(1.0)]],
    vipMultiplier: [1.6, [Validators.required, Validators.min(1.0)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);

    this.api.adminGetTheaters().subscribe({
      next: res => {
        if (res.success) {
          this.theaters.set(res.data);
          if (res.data.length > 0 && !this.editingId()) {
            this.form.patchValue({ theaterId: res.data[0].id });
          }
        }
      }
    });

    this.api.adminGetScreens().subscribe({
      next: res => {
        this.screens.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  startEdit(screen: Screen): void {
    this.editingId.set(screen.id);
    this.form.patchValue({
      name: screen.name,
      theaterId: screen.theaterId ?? null,
      totalRows: screen.totalRows,
      totalColumns: screen.totalColumns,
      premiumRows: screen.premiumRows ?? 5,
      vipRows: screen.vipRows ?? 2,
      premiumMultiplier: screen.premiumMultiplier ?? 1.3,
      vipMultiplier: screen.vipMultiplier ?? 1.6
    });
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
      const payload = {
        name: this.form.get('name')!.value!,
        theaterId: this.form.get('theaterId')!.value,
        premiumRows: Number(this.form.get('premiumRows')!.value) || 0,
        vipRows: Number(this.form.get('vipRows')!.value) || 0,
        premiumMultiplier: Number(this.form.get('premiumMultiplier')!.value) || 1.3,
        vipMultiplier: Number(this.form.get('vipMultiplier')!.value) || 1.6
      };

      this.api.adminUpdateScreen(this.editingId()!, payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Screen updated successfully!', 'OK', { duration: 3000 });
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
            this.snack.open('Screen added successfully!', 'OK', { duration: 3000 });
            this.form.get('totalRows')!.enable();
            this.form.get('totalColumns')!.enable();
            this.formDirective.resetForm({ totalRows: 10, totalColumns: 10, premiumRows: 5, vipRows: 2, premiumMultiplier: 1.3, vipMultiplier: 1.6 });
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
    if (!confirm('Are you sure you want to delete this screen?')) return;
    this.api.adminDeleteScreen(id).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('Screen deleted successfully', 'OK', { duration: 3000 });
          this.load();
        } else {
          this.snack.open(res.message, 'Close', { duration: 5000 });
        }
      },
      error: err => {
        const msg = err.error?.message || err.error?.errors?.[0] || 'Delete failed';
        this.snack.open(msg, 'Close', { duration: 5000 });
      }
    });
  }
}
