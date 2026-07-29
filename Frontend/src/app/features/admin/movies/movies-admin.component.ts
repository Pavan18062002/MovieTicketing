import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Movie } from '../../../core/models/models';

@Component({
  selector: 'app-movies-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSlideToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="page-header">
      <h1>Manage Movies</h1>
      @if (editingId()) {
        <button class="btn-add-new" (click)="cancelEdit()">
          + Add New Movie
        </button>
      }
    </div>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editingId() ? 'Edit Movie' : 'Add New Movie' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title">
            @if (form.get('title')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Genre</mat-label>
            <input matInput formControlName="genre">
            @if (form.get('genre')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Duration (minutes)</mat-label>
            <input matInput type="number" formControlName="durationMinutes">
            @if (form.get('durationMinutes')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Poster URL</mat-label>
            <input matInput formControlName="posterUrl">
          </mat-form-field>

          <mat-form-field appearance="outline" class="span-full">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
            @if (form.get('description')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          @if (editingId()) {
            <div class="span-full toggle-row">
              <mat-slide-toggle formControlName="isActive" color="primary">
                Movie is Active (visible on homepage)
              </mat-slide-toggle>
            </div>
          }

          <div class="span-full actions-row">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="18" /> }
              @else { {{ editingId() ? 'Save Changes' : 'Add Movie' }} }
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
        <table mat-table [dataSource]="movies()" class="full-width">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let m">{{ m.title }}</td>
          </ng-container>
          <ng-container matColumnDef="genre">
            <th mat-header-cell *matHeaderCellDef>Genre</th>
            <td mat-cell *matCellDef="let m">{{ m.genre }}</td>
          </ng-container>
          <ng-container matColumnDef="duration">
            <th mat-header-cell *matHeaderCellDef>Duration</th>
            <td mat-cell *matCellDef="let m">{{ m.durationMinutes }} min</td>
          </ng-container>
          <ng-container matColumnDef="shows">
            <th mat-header-cell *matHeaderCellDef>Shows</th>
            <td mat-cell *matCellDef="let m">{{ m.showCount }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Active</th>
            <td mat-cell *matCellDef="let m">
              <mat-slide-toggle [checked]="m.isActive"
                (change)="toggleActive(m, $event.checked)">
              </mat-slide-toggle>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let m">
              <button mat-icon-button color="primary" (click)="startEdit(m)" title="Edit movie">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteMovie(m.id)" title="Soft delete">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"
              [class.inactive-row]="!row.isActive"></tr>
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
    .toggle-row { padding: 4px 0; }
    .actions-row { display: flex; gap: 12px; align-items: center; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }
    .inactive-row { opacity: 0.5; }
    mat-form-field { width: 100%; }
  `]
})
export class MoviesAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  movies    = signal<Movie[]>([]);
  loading   = signal(true);
  saving    = signal(false);
  editingId = signal<number | null>(null);
  cols = ['title', 'genre', 'duration', 'shows', 'status', 'actions'];

  form = this.fb.group({
    title:           ['', Validators.required],
    description:     ['', Validators.required],
    durationMinutes: [90, [Validators.required, Validators.min(1)]],
    posterUrl:       [''],
    genre:           ['', Validators.required],
    isActive:        [true]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.adminGetMovies().subscribe(res => {
      this.movies.set(res.data ?? []);
      this.loading.set(false);
    });
  }

  startEdit(movie: Movie): void {
    this.editingId.set(movie.id);
    this.form.patchValue({
      title:           movie.title,
      description:     movie.description,
      durationMinutes: movie.durationMinutes,
      posterUrl:       movie.posterUrl,
      genre:           movie.genre,
      isActive:        movie.isActive
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ durationMinutes: 90, isActive: true });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    if (this.editingId()) {
      this.api.adminUpdateMovie(this.editingId()!, this.form.value as any).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Movie updated!', 'OK', { duration: 3000 });
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
      this.api.adminCreateMovie(this.form.value as any).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Movie added!', 'OK', { duration: 3000 });
            this.form.reset({ durationMinutes: 90, isActive: true });
            this.load();
          } else {
            this.snack.open(res.message, 'Close', { duration: 4000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Failed to add movie', 'Close', { duration: 4000 });
        }
      });
    }
  }

  toggleActive(movie: Movie, isActive: boolean): void {
    this.api.adminUpdateMovie(movie.id, { isActive }).subscribe(res => {
      if (res.success) this.load();
    });
  }

  deleteMovie(id: number): void {
    this.api.adminDeleteMovie(id).subscribe(res => {
      if (res.success) {
        this.snack.open('Movie deactivated', 'OK', { duration: 3000 });
        this.load();
      }
    });
  }
}
