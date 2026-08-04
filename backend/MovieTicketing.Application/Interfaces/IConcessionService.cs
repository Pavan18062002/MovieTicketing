using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Concessions;

namespace MovieTicketing.Application.Interfaces;

public interface IConcessionService
{
    Task<ApiResponse<List<ConcessionResponseDto>>> GetAllAsync();
    Task<ApiResponse<List<ConcessionResponseDto>>> GetAvailableAsync();
    Task<ApiResponse<ConcessionResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<ConcessionResponseDto>> CreateAsync(CreateConcessionDto dto);
    Task<ApiResponse<ConcessionResponseDto>> UpdateAsync(int id, UpdateConcessionDto dto);
    Task<ApiResponse<ConcessionResponseDto>> UpdateStockAsync(int id, UpdateConcessionStockDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
