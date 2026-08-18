using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Concessions;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class ConcessionService : IConcessionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRealTimeNotificationService _notifier;

    public ConcessionService(IUnitOfWork unitOfWork, IRealTimeNotificationService notifier)
    {
        _unitOfWork = unitOfWork;
        _notifier = notifier;
    }

    public async Task<ApiResponse<List<ConcessionResponseDto>>> GetAllAsync(int? theaterId = null, string? adminUserId = null, bool isSuperAdmin = false)
    {
        var items = await _unitOfWork.Concessions.GetAllWithTheaterAsync(theaterId);

        // If a non-superadmin is requesting, ensure items belong to their owned theaters
        if (!isSuperAdmin && !string.IsNullOrEmpty(adminUserId))
        {
            items = items.Where(c => c.Theater == null || c.Theater.AdminId == adminUserId).ToList();
        }

        var sorted = items
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .ToList();

        return ApiResponse<List<ConcessionResponseDto>>.Ok(sorted.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<ConcessionResponseDto>>> GetAvailableAsync(int? theaterId = null)
    {
        var items = await _unitOfWork.Concessions.GetAvailableAsync(theaterId);
        return ApiResponse<List<ConcessionResponseDto>>.Ok(items.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<ConcessionResponseDto>> GetByIdAsync(int id)
    {
        var item = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(item));
    }

    public async Task<ApiResponse<ConcessionResponseDto>> CreateAsync(CreateConcessionDto dto, string? adminUserId = null, bool isSuperAdmin = false)
    {
        if (dto.TheaterId.HasValue && !isSuperAdmin && !string.IsNullOrEmpty(adminUserId))
        {
            var theater = await _unitOfWork.Theaters.GetByIdAsync(dto.TheaterId.Value);
            if (theater == null || theater.AdminId != adminUserId)
                return ApiResponse<ConcessionResponseDto>.Fail("You do not have permission to add concessions to this theater.");
        }

        var item = new ConcessionItem
        {
            ItemName = dto.ItemName.Trim(),
            ItemSize = dto.ItemSize.Trim(),
            Category = dto.Category,
            Price = dto.Price,
            StockCount = dto.StockCount,
            BaseStockCount = dto.StockCount,
            TheaterId = dto.TheaterId,
            IsAvailable = dto.StockCount > 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Concessions.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        var created = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(item.Id);
        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(created ?? item), "Concession item created successfully.");
    }

    public async Task<ApiResponse<ConcessionResponseDto>> UpdateAsync(int id, UpdateConcessionDto dto, string? adminUserId = null, bool isSuperAdmin = false)
    {
        var item = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        if (!isSuperAdmin && !string.IsNullOrEmpty(adminUserId) && item.Theater != null && item.Theater.AdminId != adminUserId)
            return ApiResponse<ConcessionResponseDto>.Fail("You do not have permission to edit this concession item.");

        item.ItemName = dto.ItemName.Trim();
        item.ItemSize = dto.ItemSize.Trim();
        item.Category = dto.Category;
        item.Price = dto.Price;
        item.TheaterId = dto.TheaterId;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Concessions.Update(item);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(item.Id);
        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(updated ?? item), "Concession item updated successfully.");
    }

    public async Task<ApiResponse<ConcessionResponseDto>> UpdateStockAsync(int id, UpdateConcessionStockDto dto, string? adminUserId = null, bool isSuperAdmin = false)
    {
        var item = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        if (!isSuperAdmin && !string.IsNullOrEmpty(adminUserId) && item.Theater != null && item.Theater.AdminId != adminUserId)
            return ApiResponse<ConcessionResponseDto>.Fail("You do not have permission to restock this concession item.");

        // If the admin is restocking above the original baseline, update the baseline too
        if (dto.StockCount > item.BaseStockCount)
            item.BaseStockCount = dto.StockCount;

        item.StockCount = dto.StockCount;
        item.IsAvailable = dto.StockCount > 0;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Concessions.Update(item);
        await _unitOfWork.SaveChangesAsync();

        if (item.StockCount <= 5 || (item.BaseStockCount > 0 && item.StockCount <= (int)Math.Ceiling(item.BaseStockCount * 0.20)))
        {
            var branchInfo = item.Theater != null ? $" ({item.Theater.Name})" : "";
            await _notifier.SendLowStockAlertAsync(item.Id, $"{item.ItemName}{branchInfo}", item.ItemSize, item.StockCount, item.BaseStockCount);
        }

        var refreshed = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(item.Id);
        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(refreshed ?? item), "Stock updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id, string? adminUserId = null, bool isSuperAdmin = false)
    {
        var item = await _unitOfWork.Concessions.GetWithTheaterByIdAsync(id);
        if (item == null)
            return ApiResponse<bool>.Fail("Concession item not found.");

        if (!isSuperAdmin && !string.IsNullOrEmpty(adminUserId) && item.Theater != null && item.Theater.AdminId != adminUserId)
            return ApiResponse<bool>.Fail("You do not have permission to delete this concession item.");

        _unitOfWork.Concessions.Remove(item);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Concession item deleted successfully.");
    }

    private static ConcessionResponseDto MapToDto(ConcessionItem item)
    {
        // Low-stock: when current stock is <= 5 or falls to 20% or below of baseline
        bool isLowStock = item.StockCount > 0 && (
            item.StockCount <= 5 || 
            (item.BaseStockCount > 0 && item.StockCount <= (int)Math.Ceiling(item.BaseStockCount * 0.20))
        );

        return new ConcessionResponseDto
        {
            Id = item.Id,
            ItemName = item.ItemName,
            ItemSize = item.ItemSize,
            Category = item.Category,
            CategoryName = item.Category.ToString(),
            Price = item.Price,
            StockCount = item.StockCount,
            BaseStockCount = item.BaseStockCount,
            IsAvailable = item.IsAvailable,
            IsLowStock = isLowStock,
            TheaterId = item.TheaterId,
            TheaterName = item.Theater?.Name,
            TheaterLocation = item.Theater?.Location
        };
    }
}
