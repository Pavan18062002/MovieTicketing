using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IConcessionRepository : IGenericRepository<ConcessionItem>
{
    /// <summary>Returns items that are currently available (IsAvailable = true and StockCount > 0), optionally filtered by TheaterId.</summary>
    Task<List<ConcessionItem>> GetAvailableAsync(int? theaterId = null);

    /// <summary>Get all items including Theater entity, optionally filtered by TheaterId.</summary>
    Task<List<ConcessionItem>> GetAllWithTheaterAsync(int? theaterId = null);

    /// <summary>Get single item by ID including Theater entity.</summary>
    Task<ConcessionItem?> GetWithTheaterByIdAsync(int id);
}
