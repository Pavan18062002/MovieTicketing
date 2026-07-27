using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<Movie> Movies { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
