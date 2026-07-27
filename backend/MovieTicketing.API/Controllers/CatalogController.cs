using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

[Route("api/catalog")]
[ApiController]
public class CatalogController : ControllerBase
{
    private readonly IMovieService _movieService;

    public CatalogController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    [HttpGet("movies")]
    public async Task<IActionResult> GetMovies()
    {
        var movies = await _movieService.GetAllMoviesAsync();
        return Ok(ApiResponse<object>.Ok(movies, "Movies retrieved successfully"));
    }
}
