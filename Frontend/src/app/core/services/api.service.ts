import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse, Movie, CreateMovieRequest, UpdateMovieRequest,
  Screen, CreateScreenRequest, UpdateScreenRequest,
  Show, CreateShowRequest, UpdateShowRequest,
  ConcessionItem, CreateConcessionRequest, UpdateConcessionRequest,
  ShowSeatsResponse, CheckoutRequest, BookingResponse,
  LockSeatsRequest, LockSeatsResponse
} from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // catalog

  getActiveMovies(): Observable<ApiResponse<Movie[]>> {
    return this.http.get<ApiResponse<Movie[]>>(`${this.api}/catalog/movies`);
  }

  getMovie(id: number): Observable<ApiResponse<Movie>> {
    return this.http.get<ApiResponse<Movie>>(`${this.api}/catalog/movies/${id}`);
  }

  getShowsByMovie(movieId: number): Observable<ApiResponse<Show[]>> {
    return this.http.get<ApiResponse<Show[]>>(`${this.api}/catalog/movies/${movieId}/shows`);
  }

  getShowSeats(showId: number): Observable<ApiResponse<ShowSeatsResponse>> {
    return this.http.get<ApiResponse<ShowSeatsResponse>>(`${this.api}/catalog/shows/${showId}/seats`);
  }

  getAvailableConcessions(): Observable<ApiResponse<ConcessionItem[]>> {
    return this.http.get<ApiResponse<ConcessionItem[]>>(`${this.api}/catalog/concessions`);
  }

  // admin - movies

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

  // admin - screens

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

  // admin - shows

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

  // admin - concessions

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

  // booking

  lockSeats(payload: LockSeatsRequest): Observable<ApiResponse<LockSeatsResponse>> {
    return this.http.post<ApiResponse<LockSeatsResponse>>(`${this.api}/booking/lock-seats`, payload);
  }

  unlockSeats(payload: LockSeatsRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.api}/booking/unlock-seats`, payload);
  }

  checkout(payload: CheckoutRequest): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/booking/checkout`, payload);
  }

  getMyBookings(): Observable<ApiResponse<BookingResponse[]>> {
    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.api}/booking/my-bookings`);
  }

  getBookingById(id: number): Observable<ApiResponse<BookingResponse>> {
    return this.http.get<ApiResponse<BookingResponse>>(`${this.api}/booking/${id}`);
  }
}
