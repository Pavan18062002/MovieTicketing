using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Movies;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>Admin-only movie management CRUD.</summary>
[ApiController]
[Route("api/admin/movies")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminMoviesController : ControllerBase
{
    private readonly IMovieService _movieService;

    public AdminMoviesController(IMovieService movieService)
    {
        _movieService = movieService;
    }

    /// <summary>Get all movies.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _movieService.GetAllAsync());

    /// <summary>Get a single movie by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _movieService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new movie.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMovieDto dto)
    {
        var result = await _movieService.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Partially update a movie.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMovieDto dto)
    {
        var result = await _movieService.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Soft-delete a movie.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _movieService.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
