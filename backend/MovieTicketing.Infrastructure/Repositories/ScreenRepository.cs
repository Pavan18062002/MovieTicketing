using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class ScreenRepository : GenericRepository<Screen>, IScreenRepository
{
    public ScreenRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<Screen?> GetWithSeatsByIdAsync(int id)
    {
        return await _dbSet
            .Include(s => s.Seats)
            .Include(s => s.Theater)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<Screen>> GetAllWithShowsCountAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Include(s => s.Shows)
            .Include(s => s.Theater)
            .OrderBy(s => s.Name)
            .ToListAsync();
    }
}
