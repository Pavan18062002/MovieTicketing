using System;
using System.Collections.Generic;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Domain.Entities;

public class Booking
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public int ShowId { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;
    public DateTime BookedAt { get; set; } = DateTime.UtcNow;
    public string BookingReference { get; set; } = string.Empty;

    // Navigation
    public virtual ApplicationUser User { get; set; } = null!;
    public virtual Show Show { get; set; } = null!;
    public virtual ICollection<BookingSeat> BookingSeats { get; set; } = new List<BookingSeat>();
    public virtual ICollection<BookingConcession> BookingConcessions { get; set; } = new List<BookingConcession>();
}
