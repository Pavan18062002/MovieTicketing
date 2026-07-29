// Auth models
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
}

// Standard API wrapper matching backend ApiResponse<T>
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

// Movies
export interface Movie {
  id: number;
  title: string;
  description: string;
  durationMinutes: number;
  posterUrl: string;
  genre: string;
  isActive: boolean;
  createdAt: string;
  showCount: number;
}

export interface CreateMovieRequest {
  title: string;
  description: string;
  durationMinutes: number;
  posterUrl: string;
  genre: string;
}

export interface UpdateMovieRequest {
  title?: string;
  description?: string;
  durationMinutes?: number;
  posterUrl?: string;
  genre?: string;
  isActive?: boolean;
}

// Screens
export interface Screen {
  id: number;
  name: string;
  capacity: number;
  totalRows: number;
  totalColumns: number;
}

export interface CreateScreenRequest {
  name: string;
  totalRows: number;
  totalColumns: number;
}

export interface UpdateScreenRequest {
  name: string;
}

// Shows
export interface Show {
  id: number;
  movieId: number;
  movieTitle: string;
  posterUrl: string;
  genre: string;
  description: string;
  durationMinutes: number;
  screenId: number;
  screenName: string;
  showTime: string;
  baseTicketPrice: number;
  isActive: boolean;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
}

export interface CreateShowRequest {
  movieId: number;
  screenId: number;
  showTime: string;
  baseTicketPrice: number;
}

export interface UpdateShowRequest {
  showTime: string;
  baseTicketPrice: number;
  isActive: boolean;
}

// Concessions
export interface ConcessionItem {
  id: number;
  itemName: string;
  itemSize: string;
  category: number;
  categoryName: string;
  price: number;
  stockCount: number;
  baseStockCount: number;
  isAvailable: boolean;
  isLowStock: boolean;
}

export interface CreateConcessionRequest {
  itemName: string;
  itemSize: string;
  category: number;
  price: number;
  stockCount: number;
}

export interface UpdateConcessionRequest {
  itemName: string;
  itemSize: string;
  category: number;
  price: number;
}
