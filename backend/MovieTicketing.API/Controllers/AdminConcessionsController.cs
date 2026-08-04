using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Concessions;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>Admin-only concession item and inventory management.</summary>
[ApiController]
[Route("api/admin/concessions")]
[Authorize(Roles = "Admin")]
public class AdminConcessionsController : ControllerBase
{
    private readonly IConcessionService _concessionService;

    public AdminConcessionsController(IConcessionService concessionService)
    {
        _concessionService = concessionService;
    }

    /// <summary>Get all concession items (including unavailable).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _concessionService.GetAllAsync());

    /// <summary>Get a single concession item by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _concessionService.GetByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Create a new concession item.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateConcessionDto dto)
    {
        var result = await _concessionService.CreateAsync(dto);
        return result.Success
            ? CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Update concession item details (name, size, category, price).</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConcessionDto dto)
    {
        var result = await _concessionService.UpdateAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Patch only the stock count for an item — used by the inventory grid.</summary>
    [HttpPatch("{id:int}/stock")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateConcessionStockDto dto)
    {
        var result = await _concessionService.UpdateStockAsync(id, dto);
        return result.Success ? Ok(result) : NotFound(result);
    }

    /// <summary>Delete a concession item permanently.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _concessionService.DeleteAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
