using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.DTOs.Catalog;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class MovieService : IMovieService
{
    private readonly IAppDbContext _context;

    public MovieService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MovieDto>> GetAllMoviesAsync()
    {
        var movies = await _context.Movies
            .Where(m => m.IsActive)
            .OrderByDescending(m => m.ReleaseDate)
            .ToListAsync();

        return movies.Select(m => new MovieDto
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            DurationInMinutes = m.DurationInMinutes,
            PosterUrl = m.PosterUrl,
            Genre = m.Genre,
            ReleaseDate = m.ReleaseDate
        });
    }

    public async Task<MovieDto?> GetMovieByIdAsync(Guid id)
    {
        var m = await _context.Movies.FindAsync(id);
        if (m == null) return null;

        return new MovieDto
        {
            Id = m.Id,
            Title = m.Title,
            Description = m.Description,
            DurationInMinutes = m.DurationInMinutes,
            PosterUrl = m.PosterUrl,
            Genre = m.Genre,
            ReleaseDate = m.ReleaseDate
        };
    }
}
