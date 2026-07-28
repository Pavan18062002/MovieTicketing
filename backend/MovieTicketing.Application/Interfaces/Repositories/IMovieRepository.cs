using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IMovieRepository : IGenericRepository<Movie>
{
    Task<List<Movie>> GetAllWithShowsAsync();
    Task<List<Movie>> GetActiveWithShowsAsync();
    Task<Movie?> GetWithShowsByIdAsync(int id);
}
