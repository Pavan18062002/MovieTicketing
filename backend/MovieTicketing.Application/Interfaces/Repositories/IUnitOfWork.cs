using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IUnitOfWork : IDisposable
{
    IMovieRepository Movies { get; }
    ITheaterRepository Theaters { get; }
    IShowRepository Shows { get; }
    IScreenRepository Screens { get; }
    IConcessionRepository Concessions { get; }
    IBookingRepository Bookings { get; }

    Task<int> SaveChangesAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}
