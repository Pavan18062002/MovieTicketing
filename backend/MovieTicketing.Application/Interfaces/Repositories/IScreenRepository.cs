using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IScreenRepository : IGenericRepository<Screen>
{
    Task<Screen?> GetWithSeatsByIdAsync(int id);
    Task<List<Screen>> GetAllWithShowsCountAsync();
}
