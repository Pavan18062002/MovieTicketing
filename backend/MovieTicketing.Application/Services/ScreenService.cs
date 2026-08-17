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

    public async Task<ApiResponse<List<ScreenResponseDto>>> GetAllAsync()
    {
        var screens = await _unitOfWork.Screens.GetAllAsync();
        return ApiResponse<List<ScreenResponseDto>>.Ok(screens.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<ScreenResponseDto>> GetByIdAsync(int id)
    {
        var screen = await _unitOfWork.Screens.GetByIdAsync(id);
        if (screen == null)
            return ApiResponse<ScreenResponseDto>.Fail("Screen not found.");

        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(screen));
    }

    public async Task<ApiResponse<ScreenResponseDto>> CreateAsync(CreateScreenDto dto)
    {
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
            char rowLetter = (char)('A' + (row % 26));
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
                    SeatNumber = $"{rowLetter}{col + 1}",
                    SeatType = seatType,
                    Row = row,
                    Column = col
                });
            }
        }

        screen.Seats = seats;
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(screen), "Screen created successfully.");
    }

    public async Task<ApiResponse<ScreenResponseDto>> UpdateAsync(int id, UpdateScreenDto dto)
    {
        var screen = await _unitOfWork.Screens.GetByIdAsync(id);
        if (screen == null)
            return ApiResponse<ScreenResponseDto>.Fail("Screen not found.");

        screen.Name = dto.Name;
        _unitOfWork.Screens.Update(screen);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ScreenResponseDto>.Ok(MapToDto(screen), "Screen updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(id);
        if (screen == null)
            return ApiResponse<bool>.Fail("Screen not found.");

        _unitOfWork.Screens.Remove(screen);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Screen deleted successfully.");
    }

    private static ScreenResponseDto MapToDto(Screen screen) => new()
    {
        Id = screen.Id,
        Name = screen.Name,
        Capacity = screen.Capacity,
        TotalRows = screen.TotalRows,
        TotalColumns = screen.TotalColumns,
        PremiumRows = screen.PremiumRows,
        VipRows = screen.VipRows,
        PremiumMultiplier = screen.PremiumMultiplier > 0 ? screen.PremiumMultiplier : 1.3m,
        VipMultiplier = screen.VipMultiplier > 0 ? screen.VipMultiplier : 1.6m
    };
}
