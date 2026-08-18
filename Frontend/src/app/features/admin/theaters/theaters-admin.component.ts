import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Theater } from '../../../core/models/models';

@Component({
  selector: 'app-theaters-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './theaters-admin.component.html',
  styleUrl: './theaters-admin.component.css'
})
export class TheatersAdminComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  theaters = signal<Theater[]>([]);
  loading = signal(false);
  saving = signal(false);
  editingId = signal<number | null>(null);

  cols: string[] = ['name', 'location', 'screens', 'owner', 'actions'];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    location: ['', [Validators.required, Validators.maxLength(250)]]
  });

  ngOnInit(): void {
    this.loadTheaters();
  }

  loadTheaters(): void {
    this.loading.set(true);
    this.api.adminGetTheaters().subscribe({
      next: res => {
        this.loading.set(false);
        if (res.success) this.theaters.set(res.data);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load theaters.', 'Close', { duration: 4000 });
      }
    });
  }

  startEdit(t: Theater): void {
    this.editingId.set(t.id);
    this.form.patchValue({
      name: t.name,
      location: t.location
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    const id = this.editingId();

    if (id) {
      this.api.adminUpdateTheater(id, this.form.value).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Theater updated successfully.', 'Close', { duration: 3000 });
            this.cancelEdit();
            this.loadTheaters();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('Failed to update theater.', 'Close', { duration: 4000 });
        }
      });
    } else {
      this.api.adminCreateTheater(this.form.value).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Theater created successfully.', 'Close', { duration: 3000 });
            this.form.reset();
            this.loadTheaters();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: () => {
          this.saving.set(false);
          this.snack.open('Failed to create theater.', 'Close', { duration: 4000 });
        }
      });
    }
  }

  deleteTheater(id: number): void {
    if (!confirm('Are you sure you want to delete this theater?')) return;

    this.api.adminDeleteTheater(id).subscribe({
      next: res => {
        if (res.success) {
          this.snack.open('Theater deleted successfully.', 'Close', { duration: 3000 });
          this.loadTheaters();
        } else {
          this.snack.open(res.message, 'Close', { duration: 4000 });
        }
      },
      error: () => this.snack.open('Failed to delete theater.', 'Close', { duration: 4000 })
    });
  }
}
