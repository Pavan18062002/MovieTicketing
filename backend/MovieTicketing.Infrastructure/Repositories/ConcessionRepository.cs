using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class ConcessionRepository : GenericRepository<ConcessionItem>, IConcessionRepository
{
    public ConcessionRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<ConcessionItem>> GetAvailableAsync(int? theaterId = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(c => c.Theater)
            .Where(c => c.IsAvailable && c.StockCount > 0);

        if (theaterId.HasValue)
        {
            query = query.Where(c => c.TheaterId == theaterId.Value || c.TheaterId == null);
        }

        return await query
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .ToListAsync();
    }

    public async Task<List<ConcessionItem>> GetAllWithTheaterAsync(int? theaterId = null)
    {
        var query = _dbSet
            .AsNoTracking()
            .Include(c => c.Theater)
            .AsQueryable();

        if (theaterId.HasValue)
        {
            query = query.Where(c => c.TheaterId == theaterId.Value);
        }

        return await query
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .ToListAsync();
    }

    public async Task<ConcessionItem?> GetWithTheaterByIdAsync(int id)
    {
        return await _dbSet
            .Include(c => c.Theater)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
}
