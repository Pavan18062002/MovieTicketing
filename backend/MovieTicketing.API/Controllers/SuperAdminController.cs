using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Theaters;
using MovieTicketing.Application.DTOs.Users;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

/// <summary>
/// Super Admin-only management endpoints for managing admins, users, and viewing global system statistics.
/// </summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly IUserManagementService _userService;
    private readonly ITheaterService _theaterService;

    public SuperAdminController(
        IUserManagementService userService,
        ITheaterService theaterService)
    {
        _userService = userService;
        _theaterService = theaterService;
    }

    /// <summary>Get all registered users across the system with their roles.</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _userService.GetAllUsersAsync();
        return Ok(result);
    }

    /// <summary>Create a new Theater Admin user and optionally assign their initial branch.</summary>
    [HttpPost("admins")]
    public async Task<IActionResult> CreateAdmin([FromBody] CreateAdminDto dto)
    {
        var result = await _userService.CreateAdminAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Assign an additional theater branch to an existing Admin.</summary>
    [HttpPost("users/{userId}/theaters")]
    public async Task<IActionResult> AddTheaterToAdmin(string userId, [FromBody] CreateTheaterDto dto)
    {
        var result = await _theaterService.CreateAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Change the role of any user (SuperAdmin, Admin, EndUser).</summary>
    [HttpPut("users/{userId}/role")]
    public async Task<IActionResult> UpdateRole(string userId, [FromBody] UpdateUserRoleDto dto)
    {
        var result = await _userService.UpdateUserRoleAsync(userId, dto.Role);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Delete or disable a user account.</summary>
    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var result = await _userService.DeleteUserAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Get overall system statistics (Users, Admins, Theaters, Bookings, Revenue).</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var result = await _userService.GetSystemStatsAsync();
        return Ok(result);
    }
}
