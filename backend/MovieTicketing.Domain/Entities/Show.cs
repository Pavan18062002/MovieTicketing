using System;
using System.Collections.Generic;

namespace MovieTicketing.Domain.Entities;

public class Show
{
    public int Id { get; set; }
    public int MovieId { get; set; }
    public int ScreenId { get; set; }
    public DateTime ShowTime { get; set; }
    public decimal BaseTicketPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Movie Movie { get; set; } = null!;
    public virtual Screen Screen { get; set; } = null!;
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public virtual ICollection<BookingSeat> BookingSeats { get; set; } = new List<BookingSeat>();
}
