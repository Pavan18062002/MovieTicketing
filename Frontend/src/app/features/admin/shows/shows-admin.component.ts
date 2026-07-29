import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
  template: `
    <h1>Manage Shows</h1>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ editingId() ? 'Edit Show' : 'Schedule New Show' }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Movie</mat-label>
            <mat-select formControlName="movieId">
              @for (m of movies(); track m.id) {
                <mat-option [value]="m.id">{{ m.title }}</mat-option>
              }
            </mat-select>
            @if (form.get('movieId')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Screen</mat-label>
            <mat-select formControlName="screenId">
              @for (s of screens(); track s.id) {
                <mat-option [value]="s.id">{{ s.name }} ({{ s.capacity }} seats)</mat-option>
              }
            </mat-select>
            @if (form.get('screenId')?.hasError('required')) { <mat-error>Required</mat-error> }
          </mat-form-field>

          <!-- Date + Time picker row -->
          <div class="datetime-row span-full">
            <mat-form-field appearance="outline" class="date-field">
              <mat-label>Show Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="showDate" readonly>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              @if (form.get('showDate')?.hasError('required')) { <mat-error>Required</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline" class="time-field">
              <mat-label>Hour</mat-label>
              <mat-select formControlName="showHour">
                @for (h of hours; track h.value) {
                  <mat-option [value]="h.value">{{ h.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="time-field">
              <mat-label>Minute</mat-label>
              <mat-select formControlName="showMinute">
                @for (m of minutes; track m) {
                  <mat-option [value]="m">{{ m | number:'2.0-0' }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Base Ticket Price (₹)</mat-label>
            <input matInput type="number" formControlName="baseTicketPrice">
            @if (form.get('baseTicketPrice')?.hasError('min')) { <mat-error>Must be > 0</mat-error> }
          </mat-form-field>

          @if (editingId()) {
            <div class="span-full toggle-row">
              <mat-slide-toggle formControlName="isActive" color="primary">
                Show is Active
              </mat-slide-toggle>
            </div>
          }

          <div class="span-full actions-row">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) { <mat-spinner diameter="18" /> }
              @else { {{ editingId() ? 'Save Changes' : 'Schedule Show' }} }
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
        <table mat-table [dataSource]="shows()" class="full-width">
          <ng-container matColumnDef="movie">
            <th mat-header-cell *matHeaderCellDef>Movie</th>
            <td mat-cell *matCellDef="let s">{{ s.movieTitle }}</td>
          </ng-container>
          <ng-container matColumnDef="screen">
            <th mat-header-cell *matHeaderCellDef>Screen</th>
            <td mat-cell *matCellDef="let s">{{ s.screenName }}</td>
          </ng-container>
          <ng-container matColumnDef="showTime">
            <th mat-header-cell *matHeaderCellDef>Show Time</th>
            <td mat-cell *matCellDef="let s">{{ s.showTime | date:'dd MMM yyyy, h:mm a' }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let s">₹{{ s.baseTicketPrice }}</td>
          </ng-container>
          <ng-container matColumnDef="seats">
            <th mat-header-cell *matHeaderCellDef>Seats</th>
            <td mat-cell *matCellDef="let s">{{ s.availableSeats }}/{{ s.totalSeats }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let s">
              <button mat-icon-button color="primary" (click)="startEdit(s)" title="Edit show">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteShow(s.id)" [disabled]="!s.isActive">
                <mat-icon>cancel</mat-icon>
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
    h1 { color: #1e293b; font-weight: 800; margin-bottom: 24px; }
    .form-card { margin-bottom: 24px; border-radius: 12px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .span-full { grid-column: 1 / -1; }
    .datetime-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; }
    .date-field, .time-field { width: 100%; }
    .toggle-row { padding: 4px 0; }
    .actions-row { display: flex; gap: 12px; align-items: center; }
    .full-width { width: 100%; }
    .center { display: flex; justify-content: center; padding: 32px; }
    .inactive-row { opacity: 0.5; }
    mat-form-field { width: 100%; }
  `]
})
export class ShowsAdminComponent implements OnInit {
  private api   = inject(ApiService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

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
    this.form.reset({ baseTicketPrice: 150, isActive: true, showHour: 10, showMinute: 0 });
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
            this.form.reset({ baseTicketPrice: 150, isActive: true, showHour: 10, showMinute: 0 });
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
