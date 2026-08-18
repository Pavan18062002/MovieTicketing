using System.ComponentModel.DataAnnotations;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Application.DTOs.Concessions;

public class CreateConcessionDto
{
    [Required, MaxLength(100)]
    public string ItemName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string ItemSize { get; set; } = string.Empty;

    [Required]
    public ConcessionCategory Category { get; set; }

    [Required, Range(0.01, 500.00)]
    public decimal Price { get; set; }

    [Required, Range(0, 10000)]
    public int StockCount { get; set; }

    public int? TheaterId { get; set; }
}

public class UpdateConcessionDto
{
    [Required, MaxLength(100)]
    public string ItemName { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string ItemSize { get; set; } = string.Empty;

    [Required]
    public ConcessionCategory Category { get; set; }

    [Required, Range(0.01, 500.00)]
    public decimal Price { get; set; }

    public int? TheaterId { get; set; }
}

/// <summary>Used by PATCH /stock endpoint to update only the stock count.</summary>
public class UpdateConcessionStockDto
{
    [Required, Range(0, 10000)]
    public int StockCount { get; set; }
}

public class ConcessionResponseDto
{
    public int Id { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemSize { get; set; } = string.Empty;
    public ConcessionCategory Category { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockCount { get; set; }
    public int BaseStockCount { get; set; }
    public bool IsAvailable { get; set; }
    public int? TheaterId { get; set; }
    public string? TheaterName { get; set; }
    public string? TheaterLocation { get; set; }

    /// <summary>True when StockCount has fallen to 10% or below of BaseStockCount.</summary>
    public bool IsLowStock { get; set; }
}
