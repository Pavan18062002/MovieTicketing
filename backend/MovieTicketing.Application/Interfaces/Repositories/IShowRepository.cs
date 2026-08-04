using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IShowRepository : IGenericRepository<Show>
{
    Task<List<Show>> GetByMovieIdAsync(int movieId);
    Task<Show?> GetWithDetailsByIdAsync(int showId);
    Task<List<Show>> GetAllWithDetailsAsync();
    Task<bool> HasOverlappingShowAsync(int screenId, DateTime startTime, DateTime endTime, int? excludeShowId = null);
}
