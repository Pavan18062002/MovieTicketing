using System.Collections.Generic;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Users;

namespace MovieTicketing.Application.Interfaces;

public interface IUserManagementService
{
    Task<ApiResponse<List<UserDto>>> GetAllUsersAsync();
    Task<ApiResponse<UserDto>> CreateAdminAsync(CreateAdminDto dto);
    Task<ApiResponse<UserDto>> UpdateUserRoleAsync(string userId, string newRole);
    Task<ApiResponse<bool>> DeleteUserAsync(string userId);
    Task<ApiResponse<SystemStatsDto>> GetSystemStatsAsync();
}
