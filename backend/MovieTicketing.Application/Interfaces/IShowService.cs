using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Shows;

namespace MovieTicketing.Application.Interfaces;

public interface IShowService
{
    Task<ApiResponse<List<ShowResponseDto>>> GetAllAsync();
    Task<ApiResponse<List<ShowResponseDto>>> GetByMovieIdAsync(int movieId);
    Task<ApiResponse<ShowResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<ShowResponseDto>> CreateAsync(CreateShowDto dto);
    Task<ApiResponse<ShowResponseDto>> UpdateAsync(int id, UpdateShowDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
