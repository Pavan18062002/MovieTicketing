using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Concessions;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;

namespace MovieTicketing.Application.Services;

public class ConcessionService : IConcessionService
{
    private readonly IUnitOfWork _unitOfWork;

    public ConcessionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<List<ConcessionResponseDto>>> GetAllAsync()
    {
        var items = await _unitOfWork.Concessions.GetAllAsync();
        var sorted = items
            .OrderBy(c => c.Category)
            .ThenBy(c => c.ItemName)
            .ToList();

        return ApiResponse<List<ConcessionResponseDto>>.Ok(sorted.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<ConcessionResponseDto>> GetByIdAsync(int id)
    {
        var item = await _unitOfWork.Concessions.GetByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(item));
    }

    public async Task<ApiResponse<ConcessionResponseDto>> CreateAsync(CreateConcessionDto dto)
    {
        var item = new ConcessionItem
        {
            ItemName = dto.ItemName,
            ItemSize = dto.ItemSize,
            Category = dto.Category,
            Price = dto.Price,
            StockCount = dto.StockCount,
            // BaseStockCount captures the initial stock level for future low-stock threshold calculations
            BaseStockCount = dto.StockCount,
            IsAvailable = dto.StockCount > 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Concessions.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(item), "Concession item created successfully.");
    }

    public async Task<ApiResponse<ConcessionResponseDto>> UpdateAsync(int id, UpdateConcessionDto dto)
    {
        var item = await _unitOfWork.Concessions.GetByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        item.ItemName = dto.ItemName;
        item.ItemSize = dto.ItemSize;
        item.Category = dto.Category;
        item.Price = dto.Price;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Concessions.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(item), "Concession item updated successfully.");
    }

    public async Task<ApiResponse<ConcessionResponseDto>> UpdateStockAsync(int id, UpdateConcessionStockDto dto)
    {
        var item = await _unitOfWork.Concessions.GetByIdAsync(id);
        if (item == null)
            return ApiResponse<ConcessionResponseDto>.Fail("Concession item not found.");

        // If the admin is restocking above the original baseline, update the baseline too
        if (dto.StockCount > item.BaseStockCount)
            item.BaseStockCount = dto.StockCount;

        item.StockCount = dto.StockCount;
        item.IsAvailable = dto.StockCount > 0;
        item.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Concessions.Update(item);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<ConcessionResponseDto>.Ok(MapToDto(item), "Stock updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteAsync(int id)
    {
        var item = await _unitOfWork.Concessions.GetByIdAsync(id);
        if (item == null)
            return ApiResponse<bool>.Fail("Concession item not found.");

        _unitOfWork.Concessions.Remove(item);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Concession item deleted successfully.");
    }

    private static ConcessionResponseDto MapToDto(ConcessionItem item)
    {
        // Low-stock: when current stock falls to 10% or below of the baseline
        bool isLowStock = item.BaseStockCount > 0 &&
                          item.StockCount <= (int)Math.Ceiling(item.BaseStockCount * 0.1);

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
            IsLowStock = isLowStock
        };
    }
}
