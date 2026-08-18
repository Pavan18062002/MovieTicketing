using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Shows;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>Admin-only show scheduling management.</summary>
[ApiController]
[Route("api/admin/shows")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminShowsController : ControllerBase
{
    private readonly IShowService _showService;

    public AdminShowsController(IShowService showService)
    {
        _showService = showService;
    }

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
    private bool IsSuperAdmin => User.IsInRole("SuperAdmin");

    /// <summary>Get all scheduled shows across screens (scoped to admin's theaters if not SuperAdmin).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _showService.GetAllAsync(CurrentUserId, IsSuperAdmin));

    /// <summary>Get show details by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _showService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Schedule a show on an owned screen.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShowDto dto)
    {
        var result = await _showService.CreateAsync(dto, CurrentUserId);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Update showtime or ticket price on an owned screen.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateShowDto dto)
    {
        var result = await _showService.UpdateAsync(id, dto, CurrentUserId, IsSuperAdmin);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Deactivate a show on an owned screen.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _showService.DeleteAsync(id, CurrentUserId, IsSuperAdmin);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
