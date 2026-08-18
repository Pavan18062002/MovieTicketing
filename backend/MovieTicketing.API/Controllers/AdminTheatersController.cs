using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Theaters;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>
/// Theater management endpoints.
/// A Theater Admin manages only their owned theaters, while a SuperAdmin can manage all.
/// </summary>
[ApiController]
[Route("api/admin/theaters")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminTheatersController : ControllerBase
{
    private readonly ITheaterService _theaterService;

    public AdminTheatersController(ITheaterService theaterService)
    {
        _theaterService = theaterService;
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    private bool IsSuperAdmin => User.IsInRole("SuperAdmin");

    /// <summary>Get all theaters (owned by logged-in admin, or all if SuperAdmin).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _theaterService.GetTheatersAsync(CurrentUserId, IsSuperAdmin);
        return Ok(result);
    }

    /// <summary>Get theater by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _theaterService.GetByIdAsync(id, CurrentUserId, IsSuperAdmin);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new theater (automatically assigned to the logged-in Admin).</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTheaterDto dto)
    {
        var result = await _theaterService.CreateAsync(dto, CurrentUserId);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Update an owned theater.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTheaterDto dto)
    {
        var result = await _theaterService.UpdateAsync(id, dto, CurrentUserId, IsSuperAdmin);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Delete an owned theater.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _theaterService.DeleteAsync(id, CurrentUserId, IsSuperAdmin);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
