using System;
using System.Threading.Tasks;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IMovieRepository Movies { get; }
    public IShowRepository Shows { get; }
    public IScreenRepository Screens { get; }
    public IConcessionRepository Concessions { get; }
    public IBookingRepository Bookings { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
        Movies = new MovieRepository(_context);
        Shows = new ShowRepository(_context);
        Screens = new ScreenRepository(_context);
        Concessions = new ConcessionRepository(_context);
        Bookings = new BookingRepository(_context);
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
