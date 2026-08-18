using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Users;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class UserManagementService : IUserManagementService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAppDbContext _dbContext;

    public UserManagementService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IUnitOfWork unitOfWork,
        IAppDbContext dbContext)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _unitOfWork  = unitOfWork;
        _dbContext   = dbContext;
    }

    public async Task<ApiResponse<List<UserDto>>> GetAllUsersAsync()
    {
        var users = await _userManager.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
        var theaters = await _unitOfWork.Theaters.GetAllAsync();

        var result = new List<UserDto>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "EndUser";
            var userTheaters = theaters.Where(t => t.AdminId == user.Id).ToList();
            string? assignedNames = userTheaters.Any() 
                ? string.Join(", ", userTheaters.Select(t => $"{t.Name} ({t.Location})")) 
                : null;

            result.Add(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                Role = role,
                TheatersCount = userTheaters.Count,
                AssignedTheaterName = assignedNames,
                CreatedAt = user.CreatedAt
            });
        }

        return ApiResponse<List<UserDto>>.Ok(result);
    }

    public async Task<ApiResponse<UserDto>> CreateAdminAsync(CreateAdminDto dto)
    {
        var existing = await _userManager.FindByEmailAsync(dto.Email);
        if (existing != null)
            return ApiResponse<UserDto>.Fail("A user with this email address already exists.");

        var admin = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName.Trim(),
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(admin, dto.Password);
        if (!result.Succeeded)
        {
            return ApiResponse<UserDto>.Fail(result.Errors.Select(e => e.Description).ToList());
        }

        // Ensure Admin role exists
        if (!await _roleManager.RoleExistsAsync("Admin"))
        {
            await _roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        await _userManager.AddToRoleAsync(admin, "Admin");

        // Automatically provision assigned Theater if name is provided (Enterprise Onboarding Flow)
        string? createdTheaterName = null;
        if (!string.IsNullOrWhiteSpace(dto.TheaterName))
        {
            var theater = new Theater
            {
                Name = dto.TheaterName.Trim(),
                Location = string.IsNullOrWhiteSpace(dto.TheaterLocation) ? "Main Branch" : dto.TheaterLocation.Trim(),
                AdminId = admin.Id,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Theaters.AddAsync(theater);
            await _unitOfWork.SaveChangesAsync();
            createdTheaterName = $"{theater.Name} ({theater.Location})";
        }

        return ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = admin.Id,
            Email = admin.Email,
            FullName = admin.FullName,
            Role = "Admin",
            TheatersCount = createdTheaterName != null ? 1 : 0,
            AssignedTheaterName = createdTheaterName,
            CreatedAt = admin.CreatedAt
        }, "Theater Admin and Assigned Theater provisioned successfully.");
    }

    public async Task<ApiResponse<UserDto>> UpdateUserRoleAsync(string userId, string newRole)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<UserDto>.Fail("User not found.");

        if (!await _roleManager.RoleExistsAsync(newRole))
            return ApiResponse<UserDto>.Fail($"Role '{newRole}' does not exist.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, newRole);

        var theaters = await _unitOfWork.Theaters.GetByAdminIdAsync(user.Id);
        string? assignedNames = theaters.Any() 
            ? string.Join(", ", theaters.Select(t => $"{t.Name} ({t.Location})")) 
            : null;

        return ApiResponse<UserDto>.Ok(new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Role = newRole,
            TheatersCount = theaters.Count,
            AssignedTheaterName = assignedNames,
            CreatedAt = user.CreatedAt
        }, $"Role updated to {newRole} successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<bool>.Fail("User not found.");

        var roles = await _userManager.GetRolesAsync(user);
        if (roles.Contains("SuperAdmin"))
            return ApiResponse<bool>.Fail("SuperAdmin accounts cannot be deleted.");

        var theaters = await _unitOfWork.Theaters.GetByAdminIdAsync(user.Id);
        foreach (var t in theaters)
        {
            _unitOfWork.Theaters.Remove(t);
        }
        await _unitOfWork.SaveChangesAsync();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return ApiResponse<bool>.Fail(result.Errors.Select(e => e.Description).ToList());

        return ApiResponse<bool>.Ok(true, "User deleted successfully.");
    }

    public async Task<ApiResponse<SystemStatsDto>> GetSystemStatsAsync()
    {
        var totalUsers = await _userManager.Users.CountAsync();
        var allUsers = await _userManager.Users.ToListAsync();
        
        int totalAdmins = 0;
        foreach (var u in allUsers)
        {
            var r = await _userManager.GetRolesAsync(u);
            if (r.Contains("Admin") || r.Contains("SuperAdmin")) totalAdmins++;
        }

        var totalTheaters = await _dbContext.Theaters.CountAsync();
        var totalScreens = await _unitOfWork.Screens.GetAllAsync();
        var totalMovies = await _unitOfWork.Movies.GetAllAsync();
        var totalBookings = await _unitOfWork.Bookings.GetAllAsync();
        var totalRevenue = totalBookings.Where(b => b.Status != Domain.Enums.BookingStatus.Cancelled).Sum(b => b.TotalAmount);

        return ApiResponse<SystemStatsDto>.Ok(new SystemStatsDto
        {
            TotalUsers = totalUsers,
            TotalAdmins = totalAdmins,
            TotalTheaters = totalTheaters,
            TotalScreens = totalScreens.Count,
            TotalMovies = totalMovies.Count,
            TotalBookings = totalBookings.Count,
            TotalRevenue = totalRevenue
        });
    }
}
