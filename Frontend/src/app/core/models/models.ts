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

// Theaters (Multi-Admin Ownership)
export interface Theater {
  id: number;
  name: string;
  location: string;
  adminId: string;
  adminName: string;
  screenCount: number;
  createdAt: string;
}

export interface CreateTheaterRequest {
  name: string;
  location: string;
}

export interface UpdateTheaterRequest {
  name: string;
  location: string;
}

// User Management (Super Admin)
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  theatersCount: number;
  assignedTheaterName?: string;
  createdAt: string;
}

export interface CreateAdminRequest {
  email: string;
  fullName: string;
  password: string;
  theaterName?: string;
  theaterLocation?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalTheaters: number;
  totalScreens: number;
  totalMovies: number;
  totalBookings: number;
  totalRevenue: number;
}

// Screens
export interface Screen {
  id: number;
  name: string;
  theaterId?: number;
  theaterName?: string;
  capacity: number;
  totalRows: number;
  totalColumns: number;
  premiumRows?: number;
  vipRows?: number;
  premiumMultiplier?: number;
  vipMultiplier?: number;
}

export interface CreateScreenRequest {
  name: string;
  theaterId?: number | null;
  totalRows: number;
  totalColumns: number;
  premiumRows?: number;
  vipRows?: number;
  premiumMultiplier?: number;
  vipMultiplier?: number;
}

export interface UpdateScreenRequest {
  name: string;
  theaterId?: number | null;
  premiumRows?: number;
  vipRows?: number;
  premiumMultiplier?: number;
  vipMultiplier?: number;
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
  theaterId?: number;
  theaterName?: string;
  theaterLocation?: string;
}

export interface CreateConcessionRequest {
  itemName: string;
  itemSize: string;
  category: number;
  price: number;
  stockCount: number;
  theaterId?: number | null;
}

export interface UpdateConcessionRequest {
  itemName: string;
  itemSize: string;
  category: number;
  price: number;
  theaterId?: number | null;
}

// Seat grid
export interface SeatInfo {
  id: number;
  seatNumber: string;
  seatType: number;
  seatTypeName: string;
  row: number;
  column: number;
  price: number;
  isBooked: boolean;
}

export interface ShowSeatsResponse {
  showId: number;
  movieTitle: string;
  screenName: string;
  theaterId?: number;
  theaterName?: string;
  theaterLocation?: string;
  showTime: string;
  baseTicketPrice: number;
  totalRows: number;
  totalColumns: number;
  seats: SeatInfo[];
}

// Checkout
export interface BookingConcessionItem {
  concessionItemId: number;
  quantity: number;
}

export interface CheckoutRequest {
  showId: number;
  seatIds: number[];
  concessionItems: BookingConcessionItem[];
}

export interface LockSeatsRequest {
  showId: number;
  seatIds: number[];
}

export interface LockSeatsResponse {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  lockedSeatIds: number[];
}

// Booking response
export interface BookingSeatResponse {
  seatId: number;
  seatNumber: string;
  seatType: number;
  seatTypeName: string;
  row: number;
  column: number;
  price: number;
}

export interface BookingConcessionResponse {
  concessionItemId: number;
  itemName: string;
  itemSize: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingResponse {
  id: number;
  bookingReference: string;
  showId: number;
  movieTitle: string;
  posterUrl: string;
  screenName: string;
  showTime: string;
  seats: BookingSeatResponse[];
  concessions: BookingConcessionResponse[];
  ticketsTotal: number;
  concessionsTotal: number;
  totalAmount: number;
  status: number;
  statusName: string;
  bookedAt: string;
}
