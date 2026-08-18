using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Infrastructure.Data;

namespace MovieTicketing.Infrastructure.Repositories;

public class TheaterRepository : GenericRepository<Theater>, ITheaterRepository
{
    public TheaterRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Theater>> GetByAdminIdAsync(string adminId)
    {
        return await _context.Theaters
            .Where(t => t.AdminId == adminId)
            .Include(t => t.Screens)
            .Include(t => t.Admin)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }

    public async Task<Theater?> GetWithScreensByIdAsync(int id)
    {
        return await _context.Theaters
            .Include(t => t.Screens)
            .Include(t => t.Admin)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<List<Theater>> GetAllWithDetailsAsync()
    {
        return await _context.Theaters
            .Include(t => t.Screens)
            .Include(t => t.Admin)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();
    }
}
