import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroupDirective } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Show, Movie, Screen } from '../../../core/models/models';

@Component({
  selector: 'app-shows-admin',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, DecimalPipe, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule,
    MatSlideToggleModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatDatepickerModule, MatNativeDateModule
  ],
  templateUrl: './shows-admin.component.html',
  styleUrl: './shows-admin.component.css'
})
export class ShowsAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  shows      = signal<Show[]>([]);
  movies     = signal<Movie[]>([]);
  screens    = signal<Screen[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  editingId  = signal<number | null>(null);
  cols = ['movie', 'screen', 'showTime', 'price', 'seats', 'actions'];

  hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
  }));
  minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  form = this.fb.group({
    movieId:         [null as number | null, Validators.required],
    screenId:        [null as number | null, Validators.required],
    showDate:        [null as Date | null, Validators.required],
    showHour:        [10, Validators.required],
    showMinute:      [0, Validators.required],
    baseTicketPrice: [150, [Validators.required, Validators.min(0.01)]],
    isActive:        [true]
  });

  private buildShowTime(): string {
    const v = this.form.getRawValue();
    const d = new Date(v.showDate!);
    d.setHours(v.showHour ?? 10, v.showMinute ?? 0, 0, 0);
    return d.toISOString();
  }

  ngOnInit(): void {
    this.api.adminGetMovies().subscribe(r => this.movies.set((r.data ?? []).filter(m => m.isActive)));
    this.api.adminGetScreens().subscribe(r => this.screens.set(r.data ?? []));
    this.loadShows();
  }

  loadShows(): void {
    this.loading.set(true);
    this.api.adminGetShows().subscribe(r => {
      this.shows.set(r.data ?? []);
      this.loading.set(false);
    });
  }

  startEdit(show: Show): void {
    this.editingId.set(show.id);
    const local = new Date(show.showTime);
    const roundedMin = Math.round(local.getMinutes() / 5) * 5 % 60;

    this.form.patchValue({
      movieId:         show.movieId,
      screenId:        show.screenId,
      showDate:        local,
      showHour:        local.getHours(),
      showMinute:      roundedMin,
      baseTicketPrice: show.baseTicketPrice,
      isActive:        show.isActive
    });
    this.form.get('movieId')!.disable();
    this.form.get('screenId')!.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.form.get('movieId')!.enable();
    this.form.get('screenId')!.enable();
    this.formDirective.resetForm({ baseTicketPrice: 150, isActive: true, showHour: 10, showMinute: 0 });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();

    if (this.editingId()) {
      const payload = {
        showTime:        this.buildShowTime(),
        baseTicketPrice: v.baseTicketPrice!,
        isActive:        v.isActive ?? true
      };
      this.api.adminUpdateShow(this.editingId()!, payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Show updated!', 'OK', { duration: 3000 });
            this.cancelEdit();
            this.loadShows();
          } else {
            this.snack.open(res.message, 'Close', { duration: 5000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Update failed', 'Close', { duration: 4000 });
        }
      });
    } else {
      const payload = {
        movieId:         v.movieId!,
        screenId:        v.screenId!,
        showTime:        this.buildShowTime(),
        baseTicketPrice: v.baseTicketPrice!
      };
      this.api.adminCreateShow(payload).subscribe({
        next: res => {
          this.saving.set(false);
          if (res.success) {
            this.snack.open('Show scheduled!', 'OK', { duration: 3000 });
            this.formDirective.resetForm({ baseTicketPrice: 150, isActive: true, showHour: 10, showMinute: 0 });
            this.loadShows();
          } else {
            this.snack.open(res.message, 'Close', { duration: 5000 });
          }
        },
        error: err => {
          this.saving.set(false);
          this.snack.open(err.error?.message || 'Failed', 'Close', { duration: 4000 });
        }
      });
    }
  }

  deleteShow(id: number): void {
    this.api.adminDeleteShow(id).subscribe(res => {
      if (res.success) {
        this.snack.open('Show cancelled', 'OK', { duration: 3000 });
        this.loadShows();
      } else {
        this.snack.open(res.message, 'Close', { duration: 4000 });
      }
    });
  }
}
