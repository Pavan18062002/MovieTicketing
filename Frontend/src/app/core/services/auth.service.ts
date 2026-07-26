import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Our backend URL (Make sure the port matches your backend!)
  private apiUrl = 'http://localhost:5172/api/auth';

  constructor(private http: HttpClient) { }

  /**
   * Sends the user's registration details to the backend.
   */
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  /**
   * Sends the user's login details and expects a JWT token in return.
   */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  /**
   * Saves the JWT token to the browser's local storage.
   */
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  /**
   * Retrieves the JWT token from local storage.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Checks if the user is currently logged in.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Logs the user out by deleting the token.
   */
  logout() {
    localStorage.removeItem('token');
  }
}
