using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class MovieRepository : GenericRepository<Movie>, IMovieRepository
{
    public MovieRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Movie>> GetAllWithShowsAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(m => m.Shows)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Movie>> GetActiveWithShowsAsync()
    {
        var now = DateTime.UtcNow;
        return await _dbSet
            .AsNoTracking()
            .Include(m => m.Shows)
            .Where(m => m.IsActive && m.Shows.Any(s => s.IsActive && s.ShowTime > now))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<Movie?> GetWithShowsByIdAsync(int id)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(m => m.Shows)
            .FirstOrDefaultAsync(m => m.Id == id);
    }
}
