using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Screens;

namespace MovieTicketing.Application.Interfaces;

public interface IScreenService
{
    Task<ApiResponse<List<ScreenResponseDto>>> GetAllAsync();
    Task<ApiResponse<ScreenResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<ScreenResponseDto>> CreateAsync(CreateScreenDto dto);
    Task<ApiResponse<ScreenResponseDto>> UpdateAsync(int id, UpdateScreenDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
