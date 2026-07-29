import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Show, Movie } from '../../../core/models/models';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="spinner-wrap"><mat-spinner diameter="52" /></div>
    } @else {

      <!-- Cinematic Header -->
      @if (movieTitle()) {
        <div class="hero">
          <img class="hero-backdrop"
               [src]="posterSrc()"
               referrerpolicy="no-referrer"
               aria-hidden="true">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <img class="poster-thumb"
                 [src]="posterSrc()"
                 [alt]="movieTitle()"
                 referrerpolicy="no-referrer"
                 (error)="onImgError($event)">
            <div class="meta">
              <a routerLink="/movies" class="back-btn">
                <mat-icon class="back-icon">arrow_back_ios</mat-icon> All Movies
              </a>
              <h1>{{ movieTitle() }}</h1>
              <div class="badges">
                <span class="badge-genre">{{ genre() }}</span>
                <span class="badge-dur">
                  <mat-icon class="sm-icon">schedule</mat-icon>
                  {{ durationMinutes() }} min
                </span>
              </div>
              <p class="desc">{{ description() }}</p>
            </div>
          </div>
        </div>
      }

      <!-- Shows -->
      <div class="shows-section">
        <h2 class="section-title">
          <mat-icon>local_movies</mat-icon>
          Available Shows
        </h2>

        @if (shows().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">event_busy</mat-icon>
            <p>No upcoming shows for this movie.</p>
            <a routerLink="/movies" class="btn-back">← Back to Movies</a>
          </div>
        } @else {
          <div class="shows-grid">
            @for (show of shows(); track show.id) {
              <div class="show-card" [class.sold-out]="show.availableSeats === 0">
                <div class="show-top">
                  <div class="show-datetime">
                    <span class="show-date">{{ show.showTime | date:'EEE, dd MMM yyyy' }}</span>
                    <span class="show-time">{{ show.showTime | date:'h:mm a' }}</span>
                  </div>
                  <span class="show-price">₹{{ show.baseTicketPrice }}</span>
                </div>

                <div class="show-screen">
                  <mat-icon class="sm-icon">videocam</mat-icon>
                  {{ show.screenName }}
                </div>

                <div class="show-seats">
                  <div class="seats-bar">
                    <div class="seats-fill"
                         [style.width.%]="(show.bookedSeats / show.totalSeats) * 100"
                         [class.fill-warn]="(show.availableSeats / show.totalSeats) < 0.3"
                         [class.fill-danger]="show.availableSeats === 0">
                    </div>
                  </div>
                  <span class="seats-text">
                    @if (show.availableSeats === 0) {
                      <span class="label-danger">Sold Out</span>
                    } @else if (show.availableSeats <= 10) {
                      <span class="label-warn">⚡ Only {{ show.availableSeats }} left!</span>
                    } @else {
                      {{ show.availableSeats }} / {{ show.totalSeats }} seats available
                    }
                  </span>
                </div>

                <!-- Disable booking since Task 2 (Booking) is not yet implemented -->
                <button class="book-btn" disabled>
                  @if (show.availableSeats === 0) { Sold Out } @else { Select Seats (Coming Soon) }
                </button>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    /* ── Hero ───────────────────────────────────── */
    .hero {
      position: relative; overflow: hidden; border-radius: 16px;
      min-height: 320px; display: flex; align-items: center;
      margin-bottom: 32px;
    }
    .hero-backdrop {
      position: absolute; inset: -30px;
      width: calc(100% + 60px); height: calc(100% + 60px);
      object-fit: cover; object-position: center;
      filter: blur(28px) brightness(0.35) saturate(1.6);
      pointer-events: none;
    }
    .hero-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(67,56,202,0.88) 0%, rgba(124,58,237,0.78) 100%);
    }
    .hero-content {
      position: relative; z-index: 1;
      display: flex; gap: 32px; align-items: flex-start;
      padding: 52px 32px; width: 100%;
    }
    .poster-thumb {
      flex-shrink: 0; width: 145px; height: 215px;
      border-radius: 12px; object-fit: cover; display: block;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 3px solid rgba(255,255,255,0.25);
    }
    .meta { display: flex; flex-direction: column; gap: 12px; }
    .back-btn {
      display: inline-flex; align-items: center; gap: 2px;
      color: rgba(255,255,255,0.7); font-size: 0.82rem;
      text-decoration: none; transition: color 0.2s;
    }
    .back-btn:hover { color: #fff; }
    .back-icon { font-size: 14px !important; height: 14px !important; width: 14px !important; }
    .meta h1 {
      font-size: clamp(1.5rem, 3.5vw, 2.6rem); font-weight: 800;
      color: #fff; margin: 0; letter-spacing: -0.02em;
      text-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    .badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .badge-genre {
      background: rgba(255,255,255,0.2); color: #fff;
      padding: 4px 14px; border-radius: 20px;
      font-size: 0.8rem; font-weight: 600;
      border: 1px solid rgba(255,255,255,0.3);
    }
    .badge-dur {
      display: flex; align-items: center; gap: 4px;
      color: rgba(255,255,255,0.8); font-size: 0.85rem;
    }
    .sm-icon { font-size: 16px !important; height: 16px !important; width: 16px !important; vertical-align: middle; }
    .desc {
      color: rgba(255,255,255,0.75); font-size: 0.9rem;
      line-height: 1.65; max-width: 580px; margin: 0;
    }

    /* ── Shows Section ──────────────────────────── */
    .shows-section { padding: 0 0 60px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      color: #1e293b; font-size: 1.15rem; font-weight: 700; margin-bottom: 24px;
    }
    .section-title mat-icon { color: #6366f1; }

    .shows-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
      gap: 16px;
    }

    /* ── Show Card ──────────────────────────────── */
    .show-card {
      background: #fff; border: 1px solid #e2e8f0;
      border-radius: 16px; padding: 22px;
      display: flex; flex-direction: column; gap: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
    }
    .show-card:hover:not(.sold-out) {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(99,102,241,0.14);
      border-color: #c7d2fe;
    }
    .sold-out { opacity: 0.55; }

    .show-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .show-datetime { display: flex; flex-direction: column; gap: 2px; }
    .show-date {
      font-size: 0.72rem; color: #94a3b8; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .show-time { font-size: 1.55rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .show-price {
      font-size: 1.5rem; font-weight: 800; line-height: 1;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .show-screen {
      display: flex; align-items: center; gap: 6px;
      color: #64748b; font-size: 0.83rem;
      background: #f8fafc; padding: 7px 12px;
      border-radius: 8px; width: fit-content;
      border: 1px solid #e2e8f0;
    }

    .show-seats { display: flex; flex-direction: column; gap: 7px; }
    .seats-bar { height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .seats-fill { height: 100%; background: #22c55e; border-radius: 3px; transition: width 0.4s; min-width: 2px; }
    .seats-fill.fill-warn { background: #f59e0b; }
    .seats-fill.fill-danger { background: #ef4444; }
    .seats-text { font-size: 0.78rem; color: #94a3b8; }
    .label-danger { color: #ef4444; font-weight: 600; }
    .label-warn { color: #f59e0b; font-weight: 600; }

    .book-btn {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; border: none; border-radius: 10px;
      padding: 13px; font-size: 0.9rem; font-weight: 700;
      cursor: pointer; font-family: inherit; width: 100%;
      transition: transform 0.18s, box-shadow 0.18s;
      box-shadow: 0 4px 16px rgba(99,102,241,0.3);
      letter-spacing: 0.02em;
    }
    .book-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99,102,241,0.45);
    }
    .book-btn:disabled {
      background: #f1f5f9; color: #94a3b8;
      cursor: not-allowed; box-shadow: none;
    }

    /* ── States ─────────────────────────────────── */
    .spinner-wrap { display: flex; justify-content: center; padding: 100px; }
    .empty-state { text-align: center; padding: 80px 24px; }
    .empty-icon { font-size: 64px !important; height: 64px !important; width: 64px !important; color: #cbd5e1; }
    .empty-state p { color: #94a3b8; margin: 16px 0 24px; font-size: 1rem; }
    .btn-back {
      display: inline-block;
      background: #f1f5f9; color: #475569;
      padding: 10px 24px; border-radius: 8px;
      text-decoration: none; transition: all 0.2s;
      border: 1px solid #e2e8f0;
    }
    .btn-back:hover { background: #e2e8f0; color: #1e293b; }
  `]
})
export class ShowListComponent implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  shows   = signal<Show[]>([]);
  movie   = signal<Movie | null>(null);
  loading = signal(true);
  posterSrc = signal('https://placehold.co/145x215/13131f/818cf8?text=...');

  movieTitle      = computed(() => this.movie()?.title ?? this.shows()[0]?.movieTitle ?? '');
  genre           = computed(() => this.movie()?.genre ?? this.shows()[0]?.genre ?? '');
  description     = computed(() => this.movie()?.description ?? this.shows()[0]?.description ?? '');
  durationMinutes = computed(() => this.movie()?.durationMinutes ?? this.shows()[0]?.durationMinutes ?? 0);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    
    forkJoin({
      movieRes: this.api.getMovie(id).pipe(catchError(() => of(null))),
      showsRes: this.api.getShowsByMovie(id).pipe(catchError(() => of(null)))
    }).subscribe(({ movieRes, showsRes }) => {
      if (movieRes?.data) {
        this.movie.set(movieRes.data);
        if (movieRes.data.posterUrl) {
          this.posterSrc.set(movieRes.data.posterUrl);
        }
      }
      if (showsRes?.data) {
        this.shows.set(showsRes.data);
      }
      this.loading.set(false);
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/145x215/13131f/818cf8?text=No+Poster';
  }
}
