using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Screens;

namespace MovieTicketing.Application.Interfaces;

public interface IScreenService
{
    Task<ApiResponse<List<ScreenResponseDto>>> GetAllAsync(string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<ScreenResponseDto>> GetByIdAsync(int id, string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<ScreenResponseDto>> CreateAsync(CreateScreenDto dto, string? adminId = null);
    Task<ApiResponse<ScreenResponseDto>> UpdateAsync(int id, UpdateScreenDto dto, string? adminId = null, bool isSuperAdmin = false);
    Task<ApiResponse<bool>> DeleteAsync(int id, string? adminId = null, bool isSuperAdmin = false);
}
