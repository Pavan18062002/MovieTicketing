using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface ITheaterRepository : IGenericRepository<Theater>
{
    Task<List<Theater>> GetByAdminIdAsync(string adminId);
    Task<Theater?> GetWithScreensByIdAsync(int id);
    Task<List<Theater>> GetAllWithDetailsAsync();
}
