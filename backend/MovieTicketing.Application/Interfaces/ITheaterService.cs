using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Theaters;

namespace MovieTicketing.Application.Interfaces;

public interface ITheaterService
{
    Task<ApiResponse<List<TheaterResponseDto>>> GetTheatersAsync(string currentUserId, bool isSuperAdmin);
    Task<ApiResponse<TheaterResponseDto>> GetByIdAsync(int id, string currentUserId, bool isSuperAdmin);
    Task<ApiResponse<TheaterResponseDto>> CreateAsync(CreateTheaterDto dto, string currentAdminId);
    Task<ApiResponse<TheaterResponseDto>> UpdateAsync(int id, UpdateTheaterDto dto, string currentUserId, bool isSuperAdmin);
    Task<ApiResponse<bool>> DeleteAsync(int id, string currentUserId, bool isSuperAdmin);
}
