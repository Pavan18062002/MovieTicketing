using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.DTOs.Catalog;

namespace MovieTicketing.Application.Interfaces;

public interface IMovieService
{
    Task<IEnumerable<MovieDto>> GetAllMoviesAsync();
    Task<MovieDto?> GetMovieByIdAsync(Guid id);
}
