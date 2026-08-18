using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Theaters;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class TheaterService : ITheaterService
{
    private readonly IUnitOfWork _unitOfWork;

    public TheaterService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<TheaterResponseDto>>> GetTheatersAsync(string currentUserId, bool isSuperAdmin)
    {
        List<Theater> theaters;

        // If SuperAdmin, return all theaters across the system.
        // If Theater Admin, return ONLY their owned theaters.
        if (isSuperAdmin)
        {
            theaters = await _unitOfWork.Theaters.GetAllWithDetailsAsync();
        }
        else
        {
            theaters = await _unitOfWork.Theaters.GetByAdminIdAsync(currentUserId);
        }

        var dtoList = theaters.Select(MapToDto).ToList();
        return ApiResponse<List<TheaterResponseDto>>.Ok(dtoList);
    }

    public async Task<ApiResponse<TheaterResponseDto>> GetByIdAsync(int id, string currentUserId, bool isSuperAdmin)
    {
        var theater = await _unitOfWork.Theaters.GetWithScreensByIdAsync(id);
        if (theater == null)
            return ApiResponse<TheaterResponseDto>.Fail("Theater not found.");

        // Strict ownership check: Only owner or SuperAdmin can view
        if (!isSuperAdmin && theater.AdminId != currentUserId)
            return ApiResponse<TheaterResponseDto>.Fail("You do not have permission to access this theater.");

        return ApiResponse<TheaterResponseDto>.Ok(MapToDto(theater));
    }

    public async Task<ApiResponse<TheaterResponseDto>> CreateAsync(CreateTheaterDto dto, string currentAdminId)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return ApiResponse<TheaterResponseDto>.Fail("Theater name is required.");

        if (string.IsNullOrWhiteSpace(dto.Location))
            return ApiResponse<TheaterResponseDto>.Fail("Theater location is required.");

        var theater = new Theater
        {
            Name = dto.Name.Trim(),
            Location = dto.Location.Trim(),
            AdminId = currentAdminId, // Automatically assign the logged-in Admin as owner
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Theaters.AddAsync(theater);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.Theaters.GetWithScreensByIdAsync(theater.Id);
        return ApiResponse<TheaterResponseDto>.Ok(MapToDto(created ?? theater), "Theater created successfully.");
    }

    public async Task<ApiResponse<TheaterResponseDto>> UpdateAsync(int id, UpdateTheaterDto dto, string currentUserId, bool isSuperAdmin)
    {
        var theater = await _unitOfWork.Theaters.GetWithScreensByIdAsync(id);
        if (theater == null)
            return ApiResponse<TheaterResponseDto>.Fail("Theater not found.");

        // Strict ownership check: Only owner or SuperAdmin can update
        if (!isSuperAdmin && theater.AdminId != currentUserId)
            return ApiResponse<TheaterResponseDto>.Fail("You cannot modify another Admin's theater.");

        theater.Name = dto.Name.Trim();
        theater.Location = dto.Location.Trim();

        _unitOfWork.Theaters.Update(theater);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<TheaterResponseDto>.Ok(MapToDto(theater), "Theater updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, string currentUserId, bool isSuperAdmin)
    {
        var theater = await _unitOfWork.Theaters.GetWithScreensByIdAsync(id);
        if (theater == null)
            return ApiResponse<bool>.Fail("Theater not found.");

        // Strict ownership check: Only owner or SuperAdmin can delete
        if (!isSuperAdmin && theater.AdminId != currentUserId)
            return ApiResponse<bool>.Fail("You cannot delete another Admin's theater.");

        _unitOfWork.Theaters.Remove(theater);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Theater deleted successfully.");
    }

    private static TheaterResponseDto MapToDto(Theater t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Location = t.Location,
        AdminId = t.AdminId,
        AdminName = t.Admin?.FullName ?? "Admin",
        ScreenCount = t.Screens?.Count ?? 0,
        CreatedAt = t.CreatedAt
    };
}
