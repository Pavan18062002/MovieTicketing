using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Movie> Movies { get; }
    DbSet<Screen> Screens { get; }
    DbSet<Seat> Seats { get; }
    DbSet<Show> Shows { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<BookingSeat> BookingSeats { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
