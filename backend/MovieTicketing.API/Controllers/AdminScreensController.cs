using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Screens;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>Admin-only theater screen and layout management.</summary>
[ApiController]
[Route("api/admin/screens")]
[Authorize(Roles = "Admin")]
public class AdminScreensController : ControllerBase
{
    private readonly IScreenService _screenService;

    public AdminScreensController(IScreenService screenService)
    {
        _screenService = screenService;
    }

    /// <summary>Get all screens.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _screenService.GetAllAsync());

    /// <summary>Get screen by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _screenService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new screen with layout grid.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScreenDto dto)
    {
        var result = await _screenService.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Update screen name.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateScreenDto dto)
    {
        var result = await _screenService.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Delete a screen.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _screenService.DeleteAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
