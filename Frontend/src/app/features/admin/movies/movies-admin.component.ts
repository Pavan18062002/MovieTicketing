import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
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
  templateUrl: './movies-admin.component.html',
  styleUrl: './movies-admin.component.css'
})
export class MoviesAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

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
            this.formDirective.resetForm({ durationMinutes: 90, isActive: true });
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
