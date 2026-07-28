using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Movies;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class MovieService : IMovieService
{
    private readonly IUnitOfWork _unitOfWork;

    public MovieService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<MovieResponseDto>>> GetAllAsync()
    {
        var movies = await _unitOfWork.Movies.GetAllWithShowsAsync();
        return ApiResponse<List<MovieResponseDto>>.Ok(movies.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<MovieResponseDto>>> GetActiveAsync()
    {
        var movies = await _unitOfWork.Movies.GetActiveWithShowsAsync();
        return ApiResponse<List<MovieResponseDto>>.Ok(movies.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<MovieResponseDto>> GetByIdAsync(int id)
    {
        var movie = await _unitOfWork.Movies.GetWithShowsByIdAsync(id);
        if (movie == null)
            return ApiResponse<MovieResponseDto>.Fail("Movie not found.");

        return ApiResponse<MovieResponseDto>.Ok(MapToDto(movie));
    }

    public async Task<ApiResponse<MovieResponseDto>> CreateAsync(CreateMovieDto dto)
    {
        var movie = new Movie
        {
            Title = dto.Title,
            Description = dto.Description,
            DurationMinutes = dto.DurationMinutes,
            PosterUrl = dto.PosterUrl,
            Genre = dto.Genre,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Movies.AddAsync(movie);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<MovieResponseDto>.Ok(MapToDto(movie), "Movie created successfully.");
    }

    public async Task<ApiResponse<MovieResponseDto>> UpdateAsync(int id, UpdateMovieDto dto)
    {
        var movie = await _unitOfWork.Movies.GetByIdAsync(id);
        if (movie == null)
            return ApiResponse<MovieResponseDto>.Fail("Movie not found.");

        if (dto.Title != null) movie.Title = dto.Title;
        if (dto.Description != null) movie.Description = dto.Description;
        if (dto.DurationMinutes.HasValue) movie.DurationMinutes = dto.DurationMinutes.Value;
        if (dto.PosterUrl != null) movie.PosterUrl = dto.PosterUrl;
        if (dto.Genre != null) movie.Genre = dto.Genre;
        if (dto.IsActive.HasValue) movie.IsActive = dto.IsActive.Value;
        movie.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Movies.Update(movie);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.Movies.GetWithShowsByIdAsync(id);
        return ApiResponse<MovieResponseDto>.Ok(MapToDto(updated!), "Movie updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var movie = await _unitOfWork.Movies.GetByIdAsync(id);
        if (movie == null)
            return ApiResponse<bool>.Fail("Movie not found.");

        movie.IsActive = false;
        movie.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Movies.Update(movie);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Movie deleted successfully.");
    }

    private static MovieResponseDto MapToDto(Movie movie) => new()
    {
        Id = movie.Id,
        Title = movie.Title,
        Description = movie.Description,
        DurationMinutes = movie.DurationMinutes,
        PosterUrl = movie.PosterUrl,
        Genre = movie.Genre,
        IsActive = movie.IsActive,
        CreatedAt = movie.CreatedAt,
        ShowCount = movie.Shows?.Count(s => s.IsActive && s.ShowTime > DateTime.UtcNow) ?? 0
    };
}
