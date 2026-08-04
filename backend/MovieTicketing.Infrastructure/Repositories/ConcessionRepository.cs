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

    public async Task<List<ConcessionItem>> GetAvailableAsync()
    {
        return await _dbSet
            .AsNoTracking()
            .Where(c => c.IsAvailable && c.StockCount > 0)
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .ToListAsync();
    }
}
