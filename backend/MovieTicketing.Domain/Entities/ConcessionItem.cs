using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Domain.Entities;

/// <summary>
/// Represents a food/beverage item available for purchase at the concession counter.
/// BaseStockCount tracks the original stock level for calculating low-stock thresholds.
/// </summary>
public class ConcessionItem
{
    public int Id { get; set; }

    /// <summary>e.g. "Popcorn", "Cola", "Water"</summary>
    public string ItemName { get; set; } = string.Empty;

    /// <summary>e.g. "Small", "Medium", "Large"</summary>
    public string ItemSize { get; set; } = string.Empty;

    public ConcessionCategory Category { get; set; }

    public decimal Price { get; set; }

    /// <summary>Current available stock count.</summary>
    public int StockCount { get; set; }

    /// <summary>
    /// Stock level when last restocked — used to calculate the 10% low-stock threshold.
    /// Updated whenever admin adds new stock above current BaseStockCount.
    /// </summary>
    public int BaseStockCount { get; set; }

    public bool IsAvailable { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
