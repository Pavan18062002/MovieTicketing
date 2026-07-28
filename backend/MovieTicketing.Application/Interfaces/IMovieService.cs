using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Movies;

namespace MovieTicketing.Application.Interfaces;

public interface IMovieService
{
    Task<ApiResponse<List<MovieResponseDto>>> GetAllAsync();
    Task<ApiResponse<List<MovieResponseDto>>> GetActiveAsync();
    Task<ApiResponse<MovieResponseDto>> GetByIdAsync(int id);
    Task<ApiResponse<MovieResponseDto>> CreateAsync(CreateMovieDto dto);
    Task<ApiResponse<MovieResponseDto>> UpdateAsync(int id, UpdateMovieDto dto);
    Task<ApiResponse<bool>> DeleteAsync(int id);
}
