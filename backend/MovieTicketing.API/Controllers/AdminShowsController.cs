using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Shows;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>Admin-only show scheduling management.</summary>
[ApiController]
[Route("api/admin/shows")]
[Authorize(Roles = "Admin")]
public class AdminShowsController : ControllerBase
{
    private readonly IShowService _showService;

    public AdminShowsController(IShowService showService)
    {
        _showService = showService;
    }

    /// <summary>Get all scheduled shows across screens.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _showService.GetAllAsync());

    /// <summary>Get show details by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _showService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Schedule a show.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShowDto dto)
    {
        var result = await _showService.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Update showtime or ticket price.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShowDto dto)
    {
        var result = await _showService.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Deactivate a show.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _showService.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
