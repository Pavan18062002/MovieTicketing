import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { Show, Movie } from '../../../core/models/models';
import { forkJoin, catchError, of } from 'rxjs';

export interface DateTab {
  dayName: string;
  dateStr: string;
  fullDate: Date;
  isToday: boolean;
}

export interface TheaterShowGroup {
  theaterId: number;
  theaterName: string;
  theaterLocation: string;
  shows: Show[];
}

@Component({
  selector: 'app-show-list',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, MatIconModule, MatProgressSpinnerModule],
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

  // Dynamically generates date tabs ONLY for dates that have scheduled shows
  dateTabs = computed<DateTab[]>(() => {
    const allShows = this.shows();
    if (allShows.length === 0) return [];

    const todayStr = new Date().toDateString();

    const uniqueDatesMap = new Map<string, Date>();
    allShows.forEach(s => {
      const d = new Date(s.showTime);
      const dateKey = d.toDateString();
      if (!uniqueDatesMap.has(dateKey)) {
        uniqueDatesMap.set(dateKey, d);
      }
    });

    const sortedDates = Array.from(uniqueDatesMap.values()).sort((a, b) => a.getTime() - b.getTime());

    return sortedDates.map(d => {
      const isToday = d.toDateString() === todayStr;
      return {
        dayName: isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        fullDate: d,
        isToday
      };
    });
  });

  // Movie metadata computed signals
  movieTitle      = computed(() => this.movie()?.title ?? this.shows()[0]?.movieTitle ?? 'Movie Details');
  genre           = computed(() => this.movie()?.genre ?? this.shows()[0]?.genre ?? 'Action / Thriller');
  description     = computed(() => this.movie()?.description ?? this.shows()[0]?.description ?? '');
  durationMinutes = computed(() => this.movie()?.durationMinutes ?? this.shows()[0]?.durationMinutes ?? 120);

  genreTags = computed(() => {
    const g = this.genre();
    return g ? g.split(',').map(s => s.trim()) : ['2D', 'Action'];
  });

  // Filter shows strictly matching the active date tab
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

  // Groups shows by Cinema / Theater Branch (Industry Standard BookMyShow pattern)
  theaterGroups = computed<TheaterShowGroup[]>(() => {
    const shows = this.filteredShows();
    if (shows.length === 0) return [];

    const map = new Map<number, TheaterShowGroup>();

    shows.forEach(s => {
      const tid = s.theaterId ?? 0;
      const tname = s.theaterName || 'Main Cinema';
      const tloc = s.theaterLocation || '';

      if (!map.has(tid)) {
        map.set(tid, {
          theaterId: tid,
          theaterName: tname,
          theaterLocation: tloc,
          shows: []
        });
      }

      map.get(tid)!.shows.push(s);
    });

    // Chronologically sort shows within each theater group
    map.forEach(g => {
      g.shows.sort((a, b) => new Date(a.showTime).getTime() - new Date(b.showTime).getTime());
    });

    return Array.from(map.values());
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.movieId.set(id);

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

  selectDate(index: number): void {
    this.selectedDateIdx.set(index);
    const available = this.filteredShows();
    if (available.length > 0) {
      this.selectedShowId.set(available[0].id);
    } else {
      this.selectedShowId.set(null);
    }
  }

  proceedToSeats(showId: number): void {
    this.selectedShowId.set(showId);
    this.router.navigate(['/movies', this.movieId(), 'shows', showId, 'seats']);
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src =
      'https://placehold.co/300x450/131326/8b5cf6?text=No+Poster';
  }
}
