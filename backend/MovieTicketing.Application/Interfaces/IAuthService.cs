using MovieTicketing.Application.DTOs.Auth;

using MovieTicketing.Application.Common;

namespace MovieTicketing.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
}
