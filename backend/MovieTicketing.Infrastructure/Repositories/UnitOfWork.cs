using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _currentTransaction;

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

    public async Task BeginTransactionAsync()
    {
        if (_currentTransaction != null) return;
        _currentTransaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            if (_currentTransaction != null)
            {
                await _currentTransaction.CommitAsync();
            }
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            if (_currentTransaction != null)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync()
    {
        try
        {
            if (_currentTransaction != null)
            {
                await _currentTransaction.RollbackAsync();
            }
        }
        finally
        {
            if (_currentTransaction != null)
            {
                _currentTransaction.Dispose();
                _currentTransaction = null;
            }
        }
    }

    public void Dispose()
    {
        _currentTransaction?.Dispose();
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
