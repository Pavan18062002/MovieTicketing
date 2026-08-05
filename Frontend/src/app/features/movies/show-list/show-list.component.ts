import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Show, Movie } from '../../../core/models/models';
import { forkJoin, catchError, of } from 'rxjs';

// Data model for date tabs (Today, Tomorrow, etc.)
interface DateTab {
  dayName: string;
  dateStr: string;
  fullDate: Date;
  isToday: boolean;
}

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.css'
})
export class ShowListComponent implements OnInit {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  // Component state signals
  shows           = signal<Show[]>([]);
  movie           = signal<Movie | null>(null);
  loading         = signal(true);
  movieId         = signal(0);
  selectedDateIdx = signal(0);
  selectedShowId  = signal<number | null>(null);
  posterSrc       = signal('https://placehold.co/300x450/131326/8b5cf6?text=Loading...');

  // Dynamically generates date tabs for the next 7 days starting from current date
  dateTabs = computed<DateTab[]>(() => {
    const tabs: DateTab[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      tabs.push({
        dayName: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullDate: d,
        isToday: i === 0
      });
    }
    return tabs;
  });

  // Movie metadata computed signals
  movieTitle      = computed(() => this.movie()?.title ?? this.shows()[0]?.movieTitle ?? 'Movie Details');
  genre           = computed(() => this.movie()?.genre ?? this.shows()[0]?.genre ?? 'Action / Thriller');
  description     = computed(() => this.movie()?.description ?? this.shows()[0]?.description ?? '');
  durationMinutes = computed(() => this.movie()?.durationMinutes ?? this.shows()[0]?.durationMinutes ?? 120);

  // Splits comma-separated genre string into individual tag chips
  genreTags = computed(() => {
    const g = this.genre();
    return g ? g.split(',').map(s => s.trim()) : ['2D', 'Action'];
  });

  // Strictly filters showtimes to match the selected date tab
  filteredShows = computed(() => {
    const all = this.shows();
    if (all.length === 0) return [];
    
    const selectedTab = this.dateTabs()[this.selectedDateIdx()];
    if (!selectedTab) return [];

    return all.filter(s => {
      const showDate = new Date(s.showTime);
      return showDate.toDateString() === selectedTab.fullDate.toDateString();
    });
  });

  // Retrieves the currently selected show object
  selectedShow = computed(() => {
    const id = this.selectedShowId();
    if (id) {
      const found = this.shows().find(s => s.id === id);
      if (found) return found;
    }
    return this.filteredShows()[0] ?? null;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.movieId.set(id);
    
    // Fetch movie details and scheduled shows concurrently
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
        const showList = showsRes.data;
        this.shows.set(showList);

        if (showList.length > 0) {
          // Auto-select date tab corresponding to the earliest scheduled show
          const firstShowDate = new Date(showList[0].showTime);
          const tabIdx = this.dateTabs().findIndex(
            t => t.fullDate.toDateString() === firstShowDate.toDateString()
          );
          if (tabIdx >= 0) {
            this.selectedDateIdx.set(tabIdx);
          }
          this.selectedShowId.set(showList[0].id);
        }
      }
      this.loading.set(false);
    });
  }

  // Switches selected date tab
  selectDate(index: number): void {
    this.selectedDateIdx.set(index);
    const available = this.filteredShows();
    if (available.length > 0) {
      this.selectedShowId.set(available[0].id);
    } else {
      this.selectedShowId.set(null);
    }
  }

  // Selects a showtime pill
  selectShow(showId: number): void {
    this.selectedShowId.set(showId);
  }

  // Navigates to interactive seat selection for chosen show
  proceedToSeats(): void {
    const show = this.selectedShow();
    if (show) {
      this.router.navigate(['/movies', this.movieId(), 'shows', show.id, 'seats']);
    }
  }

  // Fallback handler if poster image fails to load
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/300x450/131326/8b5cf6?text=No+Poster';
  }
}
