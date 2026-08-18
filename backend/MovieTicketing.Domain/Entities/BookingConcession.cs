namespace MovieTicketing.Domain.Entities;

public class BookingConcession
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int ConcessionItemId { get; set; }

    // ── Snapshot columns (historical receipt pattern) ──────────────────────
    // These are copied from the ConcessionItem entity at the moment of purchase.
    // Even if the price or item name changes later in the catalog,
    // historical booking receipts will always reflect exactly what was purchased.
    public string ItemName { get; set; } = string.Empty;
    public string ItemSize { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }

    // Navigation
    public virtual Booking Booking { get; set; } = null!;
    public virtual ConcessionItem? ConcessionItem { get; set; }
}
