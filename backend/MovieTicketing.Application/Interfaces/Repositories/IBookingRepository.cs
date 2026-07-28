using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IBookingRepository : IGenericRepository<Booking>
{
    Task<Booking?> GetWithDetailsByIdAsync(int bookingId);
    Task<List<Booking>> GetByUserIdAsync(string userId);
    Task<HashSet<int>> GetBookedSeatIdsForShowAsync(int showId);
    Task<bool> AreSeatsBookedForShowAsync(int showId, IEnumerable<int> seatIds);
}
