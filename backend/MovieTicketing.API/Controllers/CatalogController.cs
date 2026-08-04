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
    private readonly IConcessionService _concessionService;

    public CatalogController(IMovieService movieService, IShowService showService, IConcessionService concessionService)
    {
        _movieService = movieService;
        _showService = showService;
        _concessionService = concessionService;
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

    [HttpGet("shows/{showId}/seats")]
    public async Task<IActionResult> GetShowSeats(int showId)
    {
        var result = await _showService.GetShowSeatsAsync(showId);
        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    [HttpGet("concessions")]
    public async Task<IActionResult> GetAvailableConcessions()
    {
        var result = await _concessionService.GetAvailableAsync();
        return Ok(result);
    }
}
