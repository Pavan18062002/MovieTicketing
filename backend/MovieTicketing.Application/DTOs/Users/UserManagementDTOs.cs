using System;
using System.ComponentModel.DataAnnotations;

namespace MovieTicketing.Application.DTOs.Users;

public class CreateAdminDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(2)]
    public string FullName { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    // Optional theater provisioning on admin creation
    public string? TheaterName { get; set; }
    public string? TheaterLocation { get; set; }
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int TheatersCount { get; set; }
    public string? AssignedTheaterName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateUserRoleDto
{
    [Required]
    public string Role { get; set; } = string.Empty; // "SuperAdmin", "Admin", "EndUser"
}

public class SystemStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalAdmins { get; set; }
    public int TotalTheaters { get; set; }
    public int TotalScreens { get; set; }
    public int TotalMovies { get; set; }
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }
}
