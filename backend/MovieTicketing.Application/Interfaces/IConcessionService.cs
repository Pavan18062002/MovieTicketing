using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Concessions;

namespace MovieTicketing.Application.Interfaces;

public interface IConcessionService
{
    Task<ApiResponse<List<ConcessionResponseDto>>> GetAllAsync(int? theaterId = null, string? adminUserId = null, bool isSuperAdmin = false);
    Task<ApiResponse<List<ConcessionResponseDto>>> GetAvailableAsync(int? theaterId = null);
    Task<ApiResponse<ConcessionResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<ConcessionResponseDto>> CreateAsync(CreateConcessionDto dto, string? adminUserId = null, bool isSuperAdmin = false);
    Task<ApiResponse<ConcessionResponseDto>> UpdateAsync(int id, UpdateConcessionDto dto, string? adminUserId = null, bool isSuperAdmin = false);
    Task<ApiResponse<ConcessionResponseDto>> UpdateStockAsync(int id, UpdateConcessionStockDto dto, string? adminUserId = null, bool isSuperAdmin = false);
    Task<ApiResponse<bool>> DeleteAsync(int id, string? adminUserId = null, bool isSuperAdmin = false);
}
