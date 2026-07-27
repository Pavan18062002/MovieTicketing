export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  durationInMinutes?: number;
  durationMinutes?: number;
  posterUrl: string;
  genre: string;
  releaseDate?: string;
  isActive: boolean;
  createdAt?: string;
}
