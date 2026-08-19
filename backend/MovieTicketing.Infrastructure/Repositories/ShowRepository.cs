using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Domain.Enums;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class ShowRepository : GenericRepository<Show>, IShowRepository
{
    public ShowRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Show>> GetByMovieIdAsync(int movieId)
    {
        var now = DateTime.UtcNow;
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Screen)
                .ThenInclude(sc => sc!.Theater)
            .Include(s => s.BookingSeats.Where(bs => bs.Booking.Status != BookingStatus.Cancelled))
            .Where(s => s.MovieId == movieId && s.IsActive && s.ShowTime > now)
            .OrderBy(s => s.ShowTime)
            .ToListAsync();
    }

    public async Task<Show?> GetWithDetailsByIdAsync(int showId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Movie)
            .Include(s => s.Screen)
                .ThenInclude(sc => sc!.Theater)
            .Include(s => s.Screen)
                .ThenInclude(sc => sc!.Seats)
            .FirstOrDefaultAsync(s => s.Id == showId);
    }

    public async Task<List<Show>> GetAllWithDetailsAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Movie)
            .Include(s => s.Screen)
                .ThenInclude(sc => sc!.Theater)
            .OrderByDescending(s => s.ShowTime)
            .ToListAsync();
    }

    public async Task<bool> HasOverlappingShowAsync(int screenId, DateTime startTime, DateTime endTime, int? excludeShowId = null)
    {
        return await _dbSet
            .Include(s => s.Movie)
            .AnyAsync(s =>
                s.ScreenId == screenId &&
                s.IsActive &&
                (excludeShowId == null || s.Id != excludeShowId) &&
                startTime < s.ShowTime.AddMinutes((s.Movie != null ? s.Movie.DurationMinutes : 120) + 15) &&
                endTime > s.ShowTime);
    }
}
