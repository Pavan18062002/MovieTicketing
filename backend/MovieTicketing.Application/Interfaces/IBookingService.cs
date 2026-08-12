using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Bookings;

namespace MovieTicketing.Application.Interfaces;

public interface IBookingService
{
    Task<ApiResponse<LockSeatsResponseDto>> LockSeatsAsync(string userId, LockSeatsRequestDto dto);
    Task<ApiResponse<bool>> UnlockSeatsAsync(string userId, LockSeatsRequestDto dto);
    Task<ApiResponse<BookingResponseDto>> CheckoutAsync(string userId, CheckoutRequestDto dto);
    Task<ApiResponse<List<BookingResponseDto>>> GetUserBookingsAsync(string userId);
    Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(int bookingId, string userId);
}
