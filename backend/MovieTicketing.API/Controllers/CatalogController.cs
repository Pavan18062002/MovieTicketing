using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MovieTicketing.API.Controllers;

[Route("api/catalog")]
[ApiController]
public class CatalogController : ControllerBase
{
    private readonly IMovieService _movieService;
    private readonly IShowService _showService;

    public CatalogController(IMovieService movieService, IShowService showService)
    {
        _movieService = movieService;
        _showService = showService;
    }

    [HttpGet("movies")]
    public async Task<IActionResult> GetActiveMovies()
    {
        var result = await _movieService.GetActiveAsync();
        return Ok(result);
    }

    [HttpGet("movies/{id}")]
    public async Task<IActionResult> GetMovieById(int id)
    {
        var result = await _movieService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("movies/{movieId}/shows")]
    public async Task<IActionResult> GetShowsByMovieId(int movieId)
    {
        var result = await _showService.GetByMovieIdAsync(movieId);
        return Ok(result);
    }
}
