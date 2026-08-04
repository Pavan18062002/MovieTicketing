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
  templateUrl: './show-list.component.html',
  styleUrl: './show-list.component.css'
})
export class ShowListComponent implements OnInit {
  private api   = inject(ApiService);
  private route = inject(ActivatedRoute);

  shows     = signal<Show[]>([]);
  movie     = signal<Movie | null>(null);
  loading   = signal(true);
  movieId   = signal(0);
  posterSrc = signal('https://placehold.co/145x215/13131f/818cf8?text=...');

  movieTitle      = computed(() => this.movie()?.title ?? this.shows()[0]?.movieTitle ?? '');
  genre           = computed(() => this.movie()?.genre ?? this.shows()[0]?.genre ?? '');
  description     = computed(() => this.movie()?.description ?? this.shows()[0]?.description ?? '');
  durationMinutes = computed(() => this.movie()?.durationMinutes ?? this.shows()[0]?.durationMinutes ?? 0);

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
