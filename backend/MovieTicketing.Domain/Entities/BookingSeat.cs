namespace MovieTicketing.Domain.Entities;

public class BookingSeat
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public int SeatId { get; set; }
    public int ShowId { get; set; }
    public decimal Price { get; set; }

    // Navigation
    public virtual Booking Booking { get; set; } = null!;
    public virtual Seat Seat { get; set; } = null!;
    public virtual Show Show { get; set; } = null!;
}
