using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Bookings;
using MovieTicketing.Application.DTOs.Shows;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Application.Services;

public class ShowService : IShowService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRedisCacheService _cache;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);

    public ShowService(IUnitOfWork unitOfWork, IRedisCacheService cache)
    {
        _unitOfWork = unitOfWork;
        _cache      = cache;
    }

    public async Task<ApiResponse<List<ShowResponseDto>>> GetAllAsync()
    {
        var shows = await _unitOfWork.Shows.GetAllWithDetailsAsync();
        return ApiResponse<List<ShowResponseDto>>.Ok(shows.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<ShowResponseDto>>> GetByMovieIdAsync(int movieId)
    {
        var key = $"shows:movie:{movieId}";

        var cached = await _cache.GetAsync<List<ShowResponseDto>>(key);
        if (cached != null)
            return ApiResponse<List<ShowResponseDto>>.Ok(cached);

        var shows = await _unitOfWork.Shows.GetByMovieIdAsync(movieId);
        var result = shows.Select(MapToDto).ToList();
        await _cache.SetAsync(key, result, CacheTtl);

        return ApiResponse<List<ShowResponseDto>>.Ok(result);
    }

    public async Task<ApiResponse<ShowResponseDto>> GetByIdAsync(int id)
    {
        var key = $"shows:{id}";

        var cached = await _cache.GetAsync<ShowResponseDto>(key);
        if (cached != null)
            return ApiResponse<ShowResponseDto>.Ok(cached);

        var show = await _unitOfWork.Shows.GetWithDetailsByIdAsync(id);
        if (show == null)
            return ApiResponse<ShowResponseDto>.Fail("Show not found.");

        var result = MapToDto(show);
        await _cache.SetAsync(key, result, CacheTtl);

        return ApiResponse<ShowResponseDto>.Ok(result);
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

        // Clear shows cache for this movie so the new show appears immediately
        await _cache.RemoveByPrefixAsync("shows:");

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

        await _cache.RemoveByPrefixAsync("shows:");

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

        await _cache.RemoveByPrefixAsync("shows:");

        return ApiResponse<bool>.Ok(true, "Show deactivated successfully.");
    }

    public async Task<ApiResponse<ShowSeatsResponseDto>> GetShowSeatsAsync(int showId)
    {
        var show = await _unitOfWork.Shows.GetWithDetailsByIdAsync(showId);
        if (show == null)
            return ApiResponse<ShowSeatsResponseDto>.Fail("Show not found.");

        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(show.ScreenId);
        if (screen == null)
            return ApiResponse<ShowSeatsResponseDto>.Fail("Screen not found.");

        var bookedSeatIds = await _unitOfWork.Bookings.GetBookedSeatIdsForShowAsync(showId);

        var seats = new List<SeatInfoDto>();
        foreach (var seat in screen.Seats)
        {
            decimal premMult = screen.PremiumMultiplier > 0 ? screen.PremiumMultiplier : 1.3m;
            decimal vipMult = screen.VipMultiplier > 0 ? screen.VipMultiplier : 1.6m;

            decimal multiplier = seat.SeatType switch
            {
                SeatType.Premium  => premMult,
                SeatType.VIP      => vipMult,
                SeatType.Standard => 1.0m,
                _                 => 1.0m
            };

            bool isBookedInDb = bookedSeatIds.Contains(seat.Id);
            var lockOwner = await _cache.GetSeatLockOwnerAsync(showId, seat.Id);
            bool isLockedInCache = !string.IsNullOrEmpty(lockOwner);

            seats.Add(new SeatInfoDto
            {
                Id          = seat.Id,
                SeatNumber  = seat.SeatNumber,
                SeatType    = seat.SeatType,
                SeatTypeName = seat.SeatType.ToString(),
                Row         = seat.Row,
                Column      = seat.Column,
                Price       = Math.Round(show.BaseTicketPrice * multiplier, 2),
                IsBooked    = isBookedInDb || isLockedInCache
            });
        }

        var result = new ShowSeatsResponseDto
        {
            ShowId = show.Id,
            MovieTitle = show.Movie?.Title ?? string.Empty,
            ScreenName = screen.Name,
            ShowTime = show.ShowTime,
            BaseTicketPrice = show.BaseTicketPrice,
            TotalRows = screen.TotalRows,
            TotalColumns = screen.TotalColumns,
            Seats = seats
        };

        return ApiResponse<ShowSeatsResponseDto>.Ok(result);
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
