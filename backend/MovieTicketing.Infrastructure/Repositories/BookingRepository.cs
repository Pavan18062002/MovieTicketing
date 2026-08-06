using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class BookingRepository : GenericRepository<Booking>, IBookingRepository
{
    public BookingRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Booking?> GetWithDetailsByIdAsync(int bookingId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Show)
                .ThenInclude(s => s.Movie)
            .Include(b => b.Show)
                .ThenInclude(s => s.Screen)
            .Include(b => b.BookingSeats)
                .ThenInclude(bs => bs.Seat)
            .FirstOrDefaultAsync(b => b.Id == bookingId);
    }

    public async Task<List<Booking>> GetByUserIdAsync(string userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(b => b.Show)
                .ThenInclude(s => s.Movie)
            .Include(b => b.Show)
                .ThenInclude(s => s.Screen)
            .Include(b => b.BookingSeats)
                .ThenInclude(bs => bs.Seat)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookedAt)
            .ToListAsync();
    }

    public async Task<HashSet<int>> GetBookedSeatIdsForShowAsync(int showId)
    {
        // Exclude cancelled bookings so their seats are freed
        var seatIds = await _context.BookingSeats
            .AsNoTracking()
            .Where(bs => bs.ShowId == showId
                      && bs.Booking.Status != MovieTicketing.Domain.Enums.BookingStatus.Cancelled)
            .Select(bs => bs.SeatId)
            .ToListAsync();

        return new HashSet<int>(seatIds);
    }

    public async Task<bool> AreSeatsBookedForShowAsync(int showId, IEnumerable<int> seatIds)
    {
        var seatIdList = seatIds.ToList();
        // Exclude cancelled bookings so their seats are freed
        return await _context.BookingSeats
            .AnyAsync(bs => bs.ShowId == showId
                         && seatIdList.Contains(bs.SeatId)
                         && bs.Booking.Status != MovieTicketing.Domain.Enums.BookingStatus.Cancelled);
    }
}
