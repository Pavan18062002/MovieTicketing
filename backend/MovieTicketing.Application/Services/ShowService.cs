using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Shows;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class ShowService : IShowService
{
    private readonly IUnitOfWork _unitOfWork;

    public ShowService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<ShowResponseDto>>> GetAllAsync()
    {
        var shows = await _unitOfWork.Shows.GetAllWithDetailsAsync();
        return ApiResponse<List<ShowResponseDto>>.Ok(shows.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<ShowResponseDto>>> GetByMovieIdAsync(int movieId)
    {
        var shows = await _unitOfWork.Shows.GetByMovieIdAsync(movieId);
        return ApiResponse<List<ShowResponseDto>>.Ok(shows.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<ShowResponseDto>> GetByIdAsync(int id)
    {
        var show = await _unitOfWork.Shows.GetWithDetailsByIdAsync(id);
        if (show == null)
            return ApiResponse<ShowResponseDto>.Fail("Show not found.");

        return ApiResponse<ShowResponseDto>.Ok(MapToDto(show));
    }

    public async Task<ApiResponse<ShowResponseDto>> CreateAsync(CreateShowDto dto)
    {
        var movie = await _unitOfWork.Movies.GetByIdAsync(dto.MovieId);
        if (movie == null)
            return ApiResponse<ShowResponseDto>.Fail("Movie not found.");

        if (!movie.IsActive)
            return ApiResponse<ShowResponseDto>.Fail("Cannot create a show for an inactive movie.");

        var screen = await _unitOfWork.Screens.GetByIdAsync(dto.ScreenId);
        if (screen == null)
            return ApiResponse<ShowResponseDto>.Fail("Screen not found.");

        var showEnd = dto.ShowTime.AddMinutes(movie.DurationMinutes + 15);
        bool conflict = await _unitOfWork.Shows.HasOverlappingShowAsync(dto.ScreenId, dto.ShowTime, showEnd);

        if (conflict)
            return ApiResponse<ShowResponseDto>.Fail(
                "This screen already has a show scheduled that overlaps with the requested time.");

        var show = new Show
        {
            MovieId = dto.MovieId,
            ScreenId = dto.ScreenId,
            ShowTime = dto.ShowTime,
            BaseTicketPrice = dto.BaseTicketPrice,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Shows.AddAsync(show);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.Shows.GetWithDetailsByIdAsync(show.Id);
        return ApiResponse<ShowResponseDto>.Ok(MapToDto(created!), "Show created successfully.");
    }

    public async Task<ApiResponse<ShowResponseDto>> UpdateAsync(int id, UpdateShowDto dto)
    {
        var show = await _unitOfWork.Shows.GetByIdAsync(id);
        if (show == null)
            return ApiResponse<ShowResponseDto>.Fail("Show not found.");

        var movie = await _unitOfWork.Movies.GetByIdAsync(show.MovieId);
        var showEnd = dto.ShowTime.AddMinutes((movie?.DurationMinutes ?? 0) + 15);

        bool conflict = await _unitOfWork.Shows.HasOverlappingShowAsync(show.ScreenId, dto.ShowTime, showEnd, excludeShowId: id);
        if (conflict)
            return ApiResponse<ShowResponseDto>.Fail(
                "The updated time conflicts with another show on the same screen.");

        show.ShowTime = dto.ShowTime;
        show.BaseTicketPrice = dto.BaseTicketPrice;
        show.IsActive = dto.IsActive;

        _unitOfWork.Shows.Update(show);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.Shows.GetWithDetailsByIdAsync(id);
        return ApiResponse<ShowResponseDto>.Ok(MapToDto(updated!), "Show updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var show = await _unitOfWork.Shows.GetByIdAsync(id);
        if (show == null)
            return ApiResponse<bool>.Fail("Show not found.");

        show.IsActive = false;
        _unitOfWork.Shows.Update(show);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Show deactivated successfully.");
    }

    private static ShowResponseDto MapToDto(Show show)
    {
        int totalSeats = show.Screen?.Capacity ?? 0;
        int bookedSeats = show.BookingSeats?.Count ?? 0;

        return new ShowResponseDto
        {
            Id = show.Id,
            MovieId = show.MovieId,
            MovieTitle = show.Movie?.Title ?? string.Empty,
            PosterUrl = show.Movie?.PosterUrl ?? string.Empty,
            Genre = show.Movie?.Genre ?? string.Empty,
            Description = show.Movie?.Description ?? string.Empty,
            DurationMinutes = show.Movie?.DurationMinutes ?? 0,
            ScreenId = show.ScreenId,
            ScreenName = show.Screen?.Name ?? string.Empty,
            ShowTime = show.ShowTime,
            BaseTicketPrice = show.BaseTicketPrice,
            IsActive = show.IsActive,
            TotalSeats = totalSeats,
            BookedSeats = bookedSeats,
            AvailableSeats = totalSeats - bookedSeats
        };
    }
}
