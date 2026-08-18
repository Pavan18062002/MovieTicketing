using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Bookings;
using MovieTicketing.Application.DTOs.Shows;

namespace MovieTicketing.Application.Interfaces;

public interface IShowService
{
    Task<ApiResponse<List<ShowResponseDto>>> GetAllAsync(string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<List<ShowResponseDto>>> GetByMovieIdAsync(int movieId);
    Task<ApiResponse<ShowResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<ShowResponseDto>> CreateAsync(CreateShowDto dto, string? adminId = null);
    Task<ApiResponse<ShowResponseDto>> UpdateAsync(int id, UpdateShowDto dto, string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<bool>> DeleteAsync(int id, string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<ShowSeatsResponseDto>> GetShowSeatsAsync(int showId);
}
