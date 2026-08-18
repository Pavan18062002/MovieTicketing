using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Screens;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Application.Services;

public class ScreenService : IScreenService
{
    private readonly IUnitOfWork _unitOfWork;

    public ScreenService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<ScreenResponseDto>>> GetAllAsync(string? adminId = null, bool isSuperAdmin = false)
    {
        var screens = await _unitOfWork.Screens.GetAllWithShowsCountAsync();

        // Scope to admin's theaters if caller is a Theater Admin
        if (!isSuperAdmin && !string.IsNullOrEmpty(adminId))
        {
            screens = screens.Where(s => s.Theater == null || s.Theater.AdminId == adminId).ToList();
        }

        return ApiResponse<List<ScreenResponseDto>>.Ok(screens.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<ScreenResponseDto>> GetByIdAsync(int id, string? adminId = null, bool isSuperAdmin = false)
    {
        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(id);
        if (screen == null)
            return ApiResponse<ScreenResponseDto>.Fail("Screen not found.");

        // Ownership check
        if (!isSuperAdmin && !string.IsNullOrEmpty(adminId) && screen.Theater != null && screen.Theater.AdminId != adminId)
            return ApiResponse<ScreenResponseDto>.Fail("You do not have permission to access this screen.");

        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(screen));
    }

    public async Task<ApiResponse<ScreenResponseDto>> CreateAsync(CreateScreenDto dto, string? adminId = null)
    {
        // If assigned to a theater, verify ownership
        if (dto.TheaterId.HasValue && !string.IsNullOrEmpty(adminId))
        {
            var theater = await _unitOfWork.Theaters.GetByIdAsync(dto.TheaterId.Value);
            if (theater == null)
                return ApiResponse<ScreenResponseDto>.Fail("Theater not found.");

            if (theater.AdminId != adminId)
                return ApiResponse<ScreenResponseDto>.Fail("You cannot add a screen to a theater you do not own.");
        }

        decimal premMult = dto.PremiumMultiplier > 0 ? dto.PremiumMultiplier : 1.3m;
        decimal vipMult = dto.VipMultiplier > 0 ? dto.VipMultiplier : 1.6m;

        int premRows = dto.PremiumRows;
        int vipRows = dto.VipRows;
        if (premRows + vipRows > dto.TotalRows)
        {
            premRows = Math.Max(0, dto.TotalRows - vipRows);
        }

        int standardRows = Math.Max(0, dto.TotalRows - (premRows + vipRows));

        var screen = new Screen
        {
            Name = dto.Name,
            TheaterId = dto.TheaterId,
            TotalRows = dto.TotalRows,
            TotalColumns = dto.TotalColumns,
            PremiumRows = premRows,
            VipRows = vipRows,
            PremiumMultiplier = premMult,
            VipMultiplier = vipMult,
            Capacity = dto.TotalRows * dto.TotalColumns,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Screens.AddAsync(screen);
        await _unitOfWork.SaveChangesAsync();

        var seats = new List<Seat>();

        for (int row = 0; row < dto.TotalRows; row++)
        {
            string rowLabel = GetRowLabel(row);
            SeatType seatType;

            if (vipRows >= dto.TotalRows)
            {
                seatType = SeatType.VIP; // All-VIP Gold Class screen!
            }
            else if (row < standardRows)
            {
                seatType = SeatType.Standard; // Remaining front rows
            }
            else if (row >= dto.TotalRows - vipRows)
            {
                seatType = SeatType.VIP; // Back rows
            }
            else
            {
                seatType = SeatType.Premium; // Middle Premium rows
            }

            for (int col = 0; col < dto.TotalColumns; col++)
            {
                seats.Add(new Seat
                {
                    ScreenId = screen.Id,
                    SeatNumber = $"{rowLabel}{col + 1}",
                    SeatType = seatType,
                    Row = row,
                    Column = col
                });
            }
        }

        screen.Seats = seats;
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.Screens.GetWithSeatsByIdAsync(screen.Id);
        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(created ?? screen), "Screen created successfully.");
    }

    public async Task<ApiResponse<ScreenResponseDto>> UpdateAsync(int id, UpdateScreenDto dto, string? adminId = null, bool isSuperAdmin = false)
    {
        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(id);
        if (screen == null)
            return ApiResponse<ScreenResponseDto>.Fail("Screen not found.");

        if (!isSuperAdmin && !string.IsNullOrEmpty(adminId) && screen.Theater != null && screen.Theater.AdminId != adminId)
            return ApiResponse<ScreenResponseDto>.Fail("You cannot modify another Admin's screen.");

        screen.Name = dto.Name;
        if (dto.TheaterId.HasValue)
            screen.TheaterId = dto.TheaterId;

        if (dto.PremiumMultiplier.HasValue && dto.PremiumMultiplier.Value > 0)
            screen.PremiumMultiplier = dto.PremiumMultiplier.Value;

        if (dto.VipMultiplier.HasValue && dto.VipMultiplier.Value > 0)
            screen.VipMultiplier = dto.VipMultiplier.Value;

        if (dto.PremiumRows.HasValue)
            screen.PremiumRows = dto.PremiumRows.Value;

        if (dto.VipRows.HasValue)
            screen.VipRows = dto.VipRows.Value;

        int premRows = screen.PremiumRows;
        int vipRows = screen.VipRows;
        if (premRows + vipRows > screen.TotalRows)
        {
            premRows = Math.Max(0, screen.TotalRows - vipRows);
            screen.PremiumRows = premRows;
        }

        int standardRows = Math.Max(0, screen.TotalRows - (premRows + vipRows));

        if (screen.Seats != null && screen.Seats.Any())
        {
            foreach (var seat in screen.Seats)
            {
                if (vipRows >= screen.TotalRows)
                    seat.SeatType = SeatType.VIP;
                else if (seat.Row < standardRows)
                    seat.SeatType = SeatType.Standard;
                else if (seat.Row >= screen.TotalRows - vipRows)
                    seat.SeatType = SeatType.VIP;
                else
                    seat.SeatType = SeatType.Premium;
            }
        }

        _unitOfWork.Screens.Update(screen);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(screen), "Screen updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, string? adminId = null, bool isSuperAdmin = false)
    {
        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(id);
        if (screen == null)
            return ApiResponse<bool>.Fail("Screen not found.");

        if (!isSuperAdmin && !string.IsNullOrEmpty(adminId) && screen.Theater != null && screen.Theater.AdminId != adminId)
            return ApiResponse<bool>.Fail("You cannot delete another Admin's screen.");

        _unitOfWork.Screens.Remove(screen);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Screen deleted successfully.");
    }

    private static string GetRowLabel(int rowIndex)
    {
        string label = string.Empty;
        int temp = rowIndex;
        while (temp >= 0)
        {
            label = (char)((temp % 26) + 'A') + label;
            temp = (temp / 26) - 1;
        }
        return label;
    }

    private static ScreenResponseDto MapToDto(Screen screen) => new()
    {
        Id = screen.Id,
        Name = screen.Name,
        TheaterId = screen.TheaterId,
        TheaterName = screen.Theater?.Name ?? string.Empty,
        Capacity = screen.Capacity,
        TotalRows = screen.TotalRows,
        TotalColumns = screen.TotalColumns,
        PremiumRows = screen.PremiumRows,
        VipRows = screen.VipRows,
        PremiumMultiplier = screen.PremiumMultiplier > 0 ? screen.PremiumMultiplier : 1.3m,
        VipMultiplier = screen.VipMultiplier > 0 ? screen.VipMultiplier : 1.6m
    };
}
