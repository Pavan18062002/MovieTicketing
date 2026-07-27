import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Movie } from '../../../core/models/models';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero / Search Section -->
    <section class="hero">
      <div class="hero-glow-1"></div>
      <div class="hero-glow-2"></div>
      <div class="hero-inner">
        <span class="hero-badge">🔥 Now Showing in Theaters</span>
        <h1>What would you like to watch?</h1>
        <p>Explore the latest blockbuster releases, discover showtimes, and experience cinema at its finest.</p>
        
        <div class="search-box" [class.focused]="focused">
          <span class="s-icon">🔍</span>
          <input class="s-input" 
                 placeholder="Search by movie title, genre, or keyword..."
                 [value]="searchText()"
                 (input)="onSearch($event)"
                 (focus)="focused = true"
                 (blur)="focused = false">
          @if (searchText()) {
            <button class="s-clear" (click)="clearSearch()" aria-label="Clear search" title="Clear">
              ✕
            </button>
          }
        </div>
      </div>
    </section>

    <!-- Filter & Grid Section -->
    <div class="content">
      <div class="toolbar">
        <div class="pills">
          <button class="pill" [class.on]="!activeGenre()" (click)="setGenre(null)">All Genres</button>
          @for (g of genres(); track g) {
            <button class="pill" [class.on]="activeGenre() === g" (click)="setGenre(g)">{{ g }}</button>
          }
        </div>
        @if (!loading()) {
          <span class="count-label">
            Showing {{ filtered().length }} movie{{ filtered().length !== 1 ? 's' : '' }}
          </span>
        }
      </div>

      @if (loading()) {
        <div class="spinner-wrap">
          <div class="css-spinner"></div>
          <span class="spinner-text">Loading latest movies...</span>
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state glass-card">
          <span class="empty-emoji">🎬</span>
          <h3>No movies found</h3>
          <p>{{ movies().length === 0 ? 'No movies currently showing. Check back soon!' : 'Try adjusting your search terms or genre filter.' }}</p>
          @if (movies().length > 0) {
            <button class="btn-primary-sm" (click)="clearSearch()">Reset Filters</button>
          }
        </div>
      } @else {
        <div class="grid">
          @for (movie of filtered(); track movie.id) {
            <div class="card">
              <div class="poster">
                <img [src]="movie.posterUrl || fallback(movie.title)"
                     [alt]="movie.title"
                     referrerpolicy="no-referrer"
                     loading="lazy"
                     (error)="onImgError($event, movie.title)">
                <div class="poster-overlay">
                  <span class="book-chip">Now Showing</span>
                </div>
              </div>
              <div class="info">
                <div class="meta-row">
                  <span class="gtag">{{ movie.genre }}</span>
                  <span class="dur">⏱️ {{ movie.durationInMinutes || movie.durationMinutes || 120 }} min</span>
                </div>
                <h3 class="title" [title]="movie.title">{{ movie.title }}</h3>
                <p class="desc">{{ movie.description }}</p>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    /* ── Hero ──────────────────────────────────────── */
    .hero {
      position: relative;
      background: linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 1) 100%);
      padding: 80px 24px 70px;
      margin: 0;
      text-align: center;
      overflow: hidden;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hero-glow-1 {
      position: absolute;
      top: -20%; left: 15%; width: 500px; height: 500px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(50px);
    }
    .hero-glow-2 {
      position: absolute;
      bottom: -10%; right: 15%; width: 400px; height: 400px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(50px);
    }
    .hero-inner {
      position: relative;
      z-index: 1;
      max-width: 700px;
      margin: 0 auto;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.4);
      color: #818cf8;
      padding: 6px 16px;
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      margin-bottom: 20px;
      text-transform: uppercase;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
    }
    .hero-inner h1 {
      font-size: clamp(2.2rem, 5vw, 3.5rem);
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 16px;
      letter-spacing: -0.03em;
      line-height: 1.15;
    }
    .hero-inner p {
      color: #94a3b8;
      font-size: 1.1rem;
      margin: 0 0 40px;
      line-height: 1.6;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(16px);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 50px;
      padding: 6px 8px 6px 20px;
      max-width: 580px;
      margin: 0 auto;
      transition: all 0.3s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    .search-box.focused {
      border-color: #6366f1;
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2), 0 15px 35px rgba(0, 0, 0, 0.4);
    }
    .s-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .s-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: #fff;
      font-size: 1rem;
      padding: 10px 4px;
      font-family: inherit;
    }
    .s-input::placeholder {
      color: #64748b;
    }
    .s-clear {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      cursor: pointer;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: all 0.2s ease;
      font-size: 0.8rem;
    }
    .s-clear:hover {
      background: #ef4444;
      transform: scale(1.05);
    }

    /* ── Content ────────────────────────────────────── */
    .content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 36px;
      flex-wrap: wrap;
    }
    .pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .pill {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #94a3b8;
      padding: 8px 20px;
      border-radius: 50px;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .pill:hover {
      border-color: rgba(99, 102, 241, 0.5);
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.08);
    }
    .pill.on {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-color: transparent;
      color: #fff;
      font-weight: 600;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    }
    .count-label {
      color: #64748b;
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* ── Grid ───────────────────────────────────────── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 28px;
    }

    /* ── Card ───────────────────────────────────────── */
    .card {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s, border-color 0.3s;
    }
    .card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 48px rgba(99, 102, 241, 0.2), 0 4px 12px rgba(0, 0, 0, 0.4);
      border-color: rgba(99, 102, 241, 0.4);
    }
    .poster {
      position: relative;
      aspect-ratio: 2/3;
      overflow: hidden;
      background: #0f172a;
    }
    .poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.4s cubic-bezier(.4,0,.2,1);
    }
    .card:hover .poster img {
      transform: scale(1.06);
    }

    .poster-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.95) 100%);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .card:hover .poster-overlay {
      opacity: 1;
    }
    .book-chip {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 50px;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.5);
      transform: translateY(10px);
      transition: transform 0.3s ease;
    }
    .card:hover .book-chip {
      transform: translateY(0);
    }

    .info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .gtag {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
    }
    .dur {
      font-size: 0.8rem;
      color: #94a3b8;
      font-weight: 500;
    }
    .title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
      margin: 0 0 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .desc {
      font-size: 0.88rem;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── States ─────────────────────────────────────── */
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px 0;
      gap: 16px;
    }
    .css-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-left-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .spinner-text {
      color: #94a3b8;
      font-size: 0.95rem;
      font-weight: 500;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      max-width: 450px;
      margin: 40px auto;
    }
    .empty-emoji {
      font-size: 4rem;
      display: block;
      margin-bottom: 16px;
    }
    .empty-state h3 {
      font-size: 1.4rem;
      color: #f8fafc;
      margin: 0 0 8px;
    }
    .empty-state p {
      color: #94a3b8;
      margin: 0 0 28px;
      line-height: 1.6;
    }
    .btn-primary-sm {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.25s ease;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .btn-primary-sm:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }
  `]
})
export class MovieListComponent implements OnInit {
  private api = inject(ApiService);
  focused     = false;
  movies      = signal<Movie[]>([]);
  loading     = signal(true);
  searchText  = signal('');
  activeGenre = signal<string | null>(null);

  genres = computed(() =>
    [...new Set(this.movies().map(m => m.genre))].filter(Boolean).sort()
  );

  filtered = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    return this.movies().filter(m => {
      const matchesSearch = !term ||
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term);
      const matchesGenre = !this.activeGenre() || m.genre === this.activeGenre();
      return matchesSearch && matchesGenre;
    });
  });

  ngOnInit(): void {
    this.api.getActiveMovies().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.movies.set(res.data);
        } else if (Array.isArray(res)) {
          this.movies.set(res);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch movies', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  setGenre(genre: string | null): void {
    this.activeGenre.set(genre);
  }

  clearSearch(): void {
    this.searchText.set('');
    this.activeGenre.set(null);
  }

  fallback(title: string): string {
    return `https://placehold.co/400x600/0f172a/6366f1?text=${encodeURIComponent(title)}`;
  }

  onImgError(event: Event, title: string): void {
    (event.target as HTMLImageElement).src = this.fallback(title);
  }
}
