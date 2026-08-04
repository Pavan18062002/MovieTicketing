using System;
using System.Collections.Generic;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Domain.Entities;

public class Seat
{
    public int Id { get; set; }
    public int ScreenId { get; set; }
    public string SeatNumber { get; set; } = string.Empty;
    public SeatType SeatType { get; set; }
    public int Row { get; set; }
    public int Column { get; set; }

    // Navigation
    public virtual Screen Screen { get; set; } = null!;
    public virtual ICollection<BookingSeat> BookingSeats { get; set; } = new List<BookingSeat>();
}
