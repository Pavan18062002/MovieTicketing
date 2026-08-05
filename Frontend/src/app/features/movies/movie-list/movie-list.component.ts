import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Movie } from '../../../core/models/models';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './movie-list.component.html',
  styleUrl: './movie-list.component.css'
})
export class MovieListComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  // State signals for active movies, search text, genre filters, and hero carousel
  focused = false;
  movies = signal<Movie[]>([]);
  loading = signal(true);
  searchText = signal('');
  activeGenre = signal<string | null>(null);
  activeSlideIndex = signal(0);

  // Computes top featured movies for hero banner carousel
  heroMovies = computed(() => {
    const list = this.movies();
    return list.length > 0 ? list.slice(0, 4) : [];
  });

  // Returns current active hero movie slide
  currentHero = computed(() => {
    const heroes = this.heroMovies();
    if (heroes.length === 0) return null;
    return heroes[this.activeSlideIndex() % heroes.length];
  });

  // Extracts unique sorted genre list across all active movies
  genres = computed(() => {
    const allGenres = this.movies()
      .map(m => m.genre)
      .filter(Boolean)
      .map(g => g.split(',').map(s => s.trim()))
      .flat();
    return [...new Set(allGenres)].sort();
  });

  // Filters movies grid by search input and active genre selection
  filtered = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    return this.movies().filter(m => {
      const matchesSearch = !term ||
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term);
      const matchesGenre = !this.activeGenre() || (m.genre && m.genre.includes(this.activeGenre()!));
      return matchesSearch && matchesGenre;
    });
  });

  ngOnInit(): void {
    // Fetch currently showing movies from catalog API
    this.api.getActiveMovies().subscribe(res => {
      this.movies.set(res.data ?? []);
      this.loading.set(false);
    });
  }

  // Updates search text signal on search input change
  onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  // Selects or deselects genre filter
  setGenre(genre: string | null): void {
    this.activeGenre.set(genre);
  }

  // Resets search bar and genre filters
  clearSearch(): void {
    this.searchText.set('');
    this.activeGenre.set(null);
  }

  // Carousel navigation handlers
  setSlide(index: number): void {
    this.activeSlideIndex.set(index);
  }

  prevSlide(): void {
    const total = this.heroMovies().length;
    if (total === 0) return;
    this.activeSlideIndex.set((this.activeSlideIndex() - 1 + total) % total);
  }

  nextSlide(): void {
    const total = this.heroMovies().length;
    if (total === 0) return;
    this.activeSlideIndex.set((this.activeSlideIndex() + 1) % total);
  }

  // Direct navigation from hero banner to showtime selection
  bookHero(): void {
    const hero = this.currentHero();
    if (hero) {
      this.router.navigate(['/movies', hero.id, 'shows']);
    }
  }

  // Fallback handler if poster image fails to load
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/400x600/181832/8b5cf6?text=No+Poster';
  }
}
