using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Domain.Entities;

public class BookingSeat
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int SeatId { get; set; }
    public int ShowId { get; set; }
    public decimal Price { get; set; }

    // ── Snapshot columns (real-world receipt pattern) ──────────────────────
    // These are copied from the Seat entity at the moment of purchase.
    // Even if the theater remodels and seat labels/types change in the future,
    // historical booking receipts will always reflect exactly what was booked.
    public string SeatNumber { get; set; } = string.Empty;
    public SeatType SeatType { get; set; }

    // Navigation
    public virtual Booking Booking { get; set; } = null!;
    public virtual Seat Seat { get; set; } = null!;
    public virtual Show Show { get; set; } = null!;
}
