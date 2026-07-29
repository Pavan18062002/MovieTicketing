using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces.Repositories;

public interface IConcessionRepository : IGenericRepository<ConcessionItem>
{
    /// <summary>Returns items that are currently available (IsAvailable = true and StockCount > 0).</summary>
    Task<List<ConcessionItem>> GetAvailableAsync();
}
