using System;
using System.Threading.Tasks;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    IMovieRepository Movies { get; }
    IShowRepository Shows { get; }
    IScreenRepository Screens { get; }
    IBookingRepository Bookings { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
