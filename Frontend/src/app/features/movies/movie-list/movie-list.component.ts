import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  
  focused      = false;
  movies       = signal<Movie[]>([]);
  loading      = signal(true);
  searchText   = signal('');
  activeGenre  = signal<string | null>(null);

  genres = computed(() => {
    const allGenres = this.movies()
      .map(m => m.genre)
      .filter(Boolean)
      .map(g => g.split(',').map(s => s.trim()))
      .flat();
    return [...new Set(allGenres)].sort();
  });

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
    this.api.getActiveMovies().subscribe(res => {
      this.movies.set(res.data ?? []);
      this.loading.set(false);
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

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/200x300/1e293b/94a3b8?text=No+Poster';
  }
}

