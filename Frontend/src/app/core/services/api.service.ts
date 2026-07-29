import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, Movie, CreateMovieRequest, UpdateMovieRequest,
  Screen, CreateScreenRequest, UpdateScreenRequest,
  Show, CreateShowRequest, UpdateShowRequest,
  ConcessionItem, CreateConcessionRequest, UpdateConcessionRequest
} from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Catalog (public — no auth required) ─────────────────────────────────
  getActiveMovies(): Observable<ApiResponse<Movie[]>> {
    return this.http.get<ApiResponse<Movie[]>>(`${this.api}/catalog/movies`);
  }

  getMovie(id: number): Observable<ApiResponse<Movie>> {
    return this.http.get<ApiResponse<Movie>>(`${this.api}/catalog/movies/${id}`);
  }

  getShowsByMovie(movieId: number): Observable<ApiResponse<Show[]>> {
    return this.http.get<ApiResponse<Show[]>>(`${this.api}/catalog/movies/${movieId}/shows`);
  }

  // ── Admin: Movies ────────────────────────────────────────────────────────
  adminGetMovies(): Observable<ApiResponse<Movie[]>> {
    return this.http.get<ApiResponse<Movie[]>>(`${this.api}/admin/movies`);
  }

  adminCreateMovie(payload: CreateMovieRequest): Observable<ApiResponse<Movie>> {
    return this.http.post<ApiResponse<Movie>>(`${this.api}/admin/movies`, payload);
  }

  adminUpdateMovie(id: number, payload: UpdateMovieRequest): Observable<ApiResponse<Movie>> {
    return this.http.put<ApiResponse<Movie>>(`${this.api}/admin/movies/${id}`, payload);
  }

  adminDeleteMovie(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.api}/admin/movies/${id}`);
  }

  // ── Admin: Screens ───────────────────────────────────────────────────────
  adminGetScreens(): Observable<ApiResponse<Screen[]>> {
    return this.http.get<ApiResponse<Screen[]>>(`${this.api}/admin/screens`);
  }

  adminCreateScreen(payload: CreateScreenRequest): Observable<ApiResponse<Screen>> {
    return this.http.post<ApiResponse<Screen>>(`${this.api}/admin/screens`, payload);
  }

  adminUpdateScreen(id: number, payload: UpdateScreenRequest): Observable<ApiResponse<Screen>> {
    return this.http.put<ApiResponse<Screen>>(`${this.api}/admin/screens/${id}`, payload);
  }

  adminDeleteScreen(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.api}/admin/screens/${id}`);
  }

  // ── Admin: Shows ─────────────────────────────────────────────────────────
  adminGetShows(): Observable<ApiResponse<Show[]>> {
    return this.http.get<ApiResponse<Show[]>>(`${this.api}/admin/shows`);
  }

  adminCreateShow(payload: CreateShowRequest): Observable<ApiResponse<Show>> {
    return this.http.post<ApiResponse<Show>>(`${this.api}/admin/shows`, payload);
  }

  adminUpdateShow(id: number, payload: UpdateShowRequest): Observable<ApiResponse<Show>> {
    return this.http.put<ApiResponse<Show>>(`${this.api}/admin/shows/${id}`, payload);
  }

  adminDeleteShow(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.api}/admin/shows/${id}`);
  }

  // ── Admin: Concessions ───────────────────────────────────────────────────
  adminGetConcessions(): Observable<ApiResponse<ConcessionItem[]>> {
    return this.http.get<ApiResponse<ConcessionItem[]>>(`${this.api}/admin/concessions`);
  }

  adminCreateConcession(payload: CreateConcessionRequest): Observable<ApiResponse<ConcessionItem>> {
    return this.http.post<ApiResponse<ConcessionItem>>(`${this.api}/admin/concessions`, payload);
  }

  adminUpdateConcession(id: number, payload: UpdateConcessionRequest): Observable<ApiResponse<ConcessionItem>> {
    return this.http.put<ApiResponse<ConcessionItem>>(`${this.api}/admin/concessions/${id}`, payload);
  }

  adminUpdateStock(id: number, stockCount: number): Observable<ApiResponse<ConcessionItem>> {
    return this.http.patch<ApiResponse<ConcessionItem>>(`${this.api}/admin/concessions/${id}/stock`, { stockCount });
  }

  adminDeleteConcession(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.api}/admin/concessions/${id}`);
  }
}
